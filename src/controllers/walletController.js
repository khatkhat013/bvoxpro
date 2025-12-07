/**
 * Wallet Controller - Request Handler
 * Receives HTTP requests, validates input, calls services, formats responses.
 */

const WalletService = require('../services/walletService');
const { requireAuth } = require('../middleware/auth');

class WalletController {
  /**
   * Connect wallet endpoint
   * POST /api/wallet/connect
   */
  static async connectWallet(req, res, body) {
    try {
      const { address } = body;

      if (!address) {
        return res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Address is required' }));
        return;
      }

      const result = await WalletService.connectWallet(address);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        code: 1,
        data: result.user,
        isNewUser: result.isNewUser
      }));
    } catch (error) {
      console.error('[WalletController.connectWallet]', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        code: 0,
        error: error.message
      }));
    }
  }

  /**
   * Get user balance
   * POST /api/wallet/balance
   */
  static async getBalance(req, res, body) {
    try {
      let { userid, coin = 'usdt' } = body || {};

      // If userid not provided, try to extract from Authorization JWT
      if (!userid) {
        const decoded = requireAuth(req, res);
        if (!decoded) return; // requireAuth already sent 401
        userid = decoded.userid || decoded.userid;
      }

      const balance = await WalletService.getUserBalance(userid, coin);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        code: 1,
        data: {
          userid,
          coin,
          balance
        }
      }));
    } catch (error) {
      console.error('[WalletController.getBalance]', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        code: 0,
        error: error.message
      }));
    }
  }

  /**
   * Update balance
   * POST /api/wallet/update-balance
   */
  static async updateBalance(req, res, body) {
    try {
      const { userid, coin, amount } = body;

      if (!userid || !coin || amount === undefined) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'userid, coin, and amount are required' }));
        return;
      }

      const result = await WalletService.updateBalance(userid, coin, amount);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        code: 1,
        data: result.user
      }));
    } catch (error) {
      console.error('[WalletController.updateBalance]', error.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        code: 0,
        error: error.message
      }));
    }
  }
}

module.exports = WalletController;
