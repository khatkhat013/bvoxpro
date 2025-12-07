/**
 * Auth Service - Business Logic for registration and wallet login
 * Uses existing UserModel and WalletService for persistence and business rules.
 */

const UserModel = require('../models/userModel');
const WalletService = require('./walletService');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

class AuthService {
  /**
   * Register or connect a wallet address and create user if needed
   * Returns { user, isNewUser }
   */
  static async registerWallet(address, meta = {}) {
    if (!address) throw new Error('address is required');
    // Delegate to WalletService which already handles creating or finding a user
    const result = await WalletService.connectWallet(address);
    // Optionally attach meta/session fields
    if (meta.session || meta.token) {
      const user = result.user;
      user.lastSession = meta.session || user.lastSession;
      user.lastToken = meta.token || user.lastToken;
      await UserModel.save(user);
    }
    return result;
  }

  /**
   * Simple wallet-based login: validate signature or return user by address
   * For now, it returns user by address; signature verification is delegated
   * to WalletService.verifySignature if provided.
   */
    static async loginWithWallet(address, signature = null, message = null) {
    if (!address) throw new Error('address is required');
    const user = await UserModel.findByAddress(address);
    if (!user) throw new Error('User not found');

    if (signature && message) {
      // WalletService may expose signature verification; if exists, use it
      try {
        const ok = await WalletService.verifySignature(address, message, signature);
        if (!ok) throw new Error('Invalid signature');
      } catch (e) {
        throw new Error('Signature verification failed');
      }
    }
    
    // Create JWT token
    const payload = { userid: user.userid, address: user.address };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    user.lastLoginAt = Date.now();
    user.lastSessionToken = token;
    await UserModel.save(user);

    return { user, token };
  }
}

module.exports = AuthService;
