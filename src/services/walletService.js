/**
 * Wallet Service - Business Logic Layer
 * Handles all wallet-related operations.
 * Depends on data models (which can be JSON or MongoDB).
 */

const WalletModel = require('../models/walletModel');
const UserModel = require('../models/userModel');

class WalletService {
  /**
   * Connect a wallet (create new user if needed)
   * @param {string} address - Ethereum address
   * @returns {object} - User object
   */
  static async connectWallet(address) {
    if (!address) {
      throw new Error('Address is required');
    }

    const normalizedAddress = address.toLowerCase();
    
    // Check if wallet already exists
    let user = UserModel.findByAddress(normalizedAddress);
    if (user) {
      return { success: true, isNewUser: false, user };
    }

    // Create new user
    const newUser = {
      userid: this.generateUserId(),
      address: normalizedAddress,
      createdAt: Math.floor(Date.now() / 1000),
      balances: {
        usdt: 0,
        btc: 0,
        eth: 0,
        usdc: 0,
        pyusd: 0,
        sol: 0
      },
      kycStatus: 'pending'
    };

    UserModel.save(newUser);
    return { success: true, isNewUser: true, user: newUser };
  }

  /**
   * Get user balance for a specific coin
   * @param {string} userid - User ID
   * @param {string} coin - Coin type (usdt, btc, eth, etc.)
   * @returns {string} - Balance amount
   */
  static async getUserBalance(userid, coin = 'usdt') {
    const user = UserModel.findById(userid);
    if (!user) {
      throw new Error('User not found');
    }

    return user.balances?.[coin] || '0';
  }

  /**
   * Update user balance
   * @param {string} userid - User ID
   * @param {string} coin - Coin type
   * @param {number} amount - Amount to add/subtract (can be negative)
   * @returns {object} - Updated user object
   */
  static async updateBalance(userid, coin, amount) {
    const user = UserModel.findById(userid);
    if (!user) {
      throw new Error('User not found');
    }

    // Ensure balances object exists
    if (!user.balances) {
      user.balances = {};
    }

    const currentBalance = parseFloat(user.balances[coin] || 0);
    const newBalance = currentBalance + parseFloat(amount);

    if (newBalance < 0) {
      throw new Error(`Insufficient balance. Current: ${currentBalance}, Requested: ${amount}`);
    }

    user.balances[coin] = newBalance;
    UserModel.save(user);

    return { success: true, user };
  }

  /**
   * Generate a unique user ID
   * @returns {string} - Unique user ID
   */
  static generateUserId() {
    // Simple implementation: timestamp + random
    // In production, use UUID or database sequence
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${timestamp}-${random}`;
  }

  /**
   * Verify wallet signature
   * @param {string} address - Wallet address
   * @param {string} message - Message that was signed
   * @param {string} signature - Signature
   * @returns {boolean} - Whether signature is valid
   */
  static verifySignature(address, message, signature) {
    // TODO: Implement ethers.js or web3.js signature verification
    // For now, just return true for testing
    return true;
  }
}

module.exports = WalletService;
