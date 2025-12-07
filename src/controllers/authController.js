/**
 * Auth Controller - HTTP handlers for registration and login
 */

const AuthService = require('../services/authService');

class AuthController {
  static async register(req, res, body) {
    try {
      const address = body && body.address;
      const session = (body && body.session) || null;
      const token = (body && body.token) || null;

      if (!address) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'address is required' }));
        return;
      }

      const result = await AuthService.registerWallet(address, { session, token });
      // If register returned a user and token, sign a JWT (AuthService.registerWallet currently delegates to WalletService)
      // For backward compatibility return a token if present
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, user: result.user, isNewUser: result.isNewUser, token: result.token || null }));
    } catch (e) {
      console.error('[AuthController.register]', e && e.message ? e.message : e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  static async login(req, res, body) {
    try {
      const address = body && body.address;
      const signature = body && body.signature;
      const message = body && body.message;

      if (!address) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'address is required' }));
        return;
      }

      const result = await AuthService.loginWithWallet(address, signature, message);
      // result contains { user, token }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, user: result.user, token: result.token }));
    } catch (e) {
      console.error('[AuthController.login]', e && e.message ? e.message : e);
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }
}

module.exports = AuthController;
