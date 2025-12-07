/**
 * Wallet Routes - API Endpoint Mapping
 * Maps HTTP methods + paths to controller methods.
 */

const WalletController = require('../controllers/walletController');

/**
 * Registers wallet routes
 * @param {Object} server - HTTP server instance
 * @param {Function} parseBody - Parses JSON request body
 */
function registerWalletRoutes(server) {
  // Replace original request listener with a wrapper that handles wallet routes
  const originalRequestListener = server.listeners('request')[0];
  if (!originalRequestListener) return;

  // Remove the original so we control when it's called
  server.removeListener('request', originalRequestListener);

  server.on('request', (req, res) => {
    const { method, url } = req;

    // Quick path: if this is NOT a wallet route, delegate to original immediately
    if (!(method === 'POST' && (url === '/api/wallet/connect' || url === '/api/wallet/balance' || url === '/api/wallet/update-balance'))) {
      // Delegate to original handler without consuming the request stream
      return originalRequestListener.call(server, req, res);
    }

    // For wallet routes, consume the body and handle here
    let body = '';
    req.on('data', chunk => { body += chunk });
    req.on('end', async () => {
      let parsedBody = {};
      if (body) {
        try {
          const idx = body.indexOf('}&');
          const cleanBody = idx > -1 ? body.substring(0, idx) : body;
          parsedBody = JSON.parse(cleanBody);
        } catch (e) {
          // Fallback: ignore parse error and leave parsedBody as {}
        }
      }

      try {
        if (method === 'POST' && url === '/api/wallet/connect') {
          return WalletController.connectWallet(req, res, parsedBody);
        }
        if (method === 'POST' && url === '/api/wallet/balance') {
          return WalletController.getBalance(req, res, parsedBody);
        }
        if (method === 'POST' && url === '/api/wallet/update-balance') {
          return WalletController.updateBalance(req, res, parsedBody);
        }
      } catch (e) {
        console.error('[walletRoutes] handler error', e && e.message ? e.message : e);
        try {
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
          }
        } catch (e2) {}
      }
    });
  });
}

module.exports = registerWalletRoutes;
