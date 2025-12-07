/**
 * Auth Routes - register / login mapping
 */

const AuthController = require('../controllers/authController');

function registerAuthRoutes(server) {
  const originalRequestListener = server.listeners('request')[0];
  if (!originalRequestListener) return;

  // We will remove and re-add a wrapper similar to walletRoutes pattern
  server.removeListener('request', originalRequestListener);

  server.on('request', (req, res) => {
    const { method, url } = req;

    // Only handle POST /api/register and POST /api/login
    if (!(method === 'POST' && (url === '/api/register' || url === '/api/login'))) {
      return originalRequestListener.call(server, req, res);
    }

    let body = '';
    req.on('data', chunk => { body += chunk });
    req.on('end', async () => {
      let parsed = {};
      if (body) {
        try {
          const idx = body.indexOf('}&');
          const clean = idx > -1 ? body.substring(0, idx) : body;
          parsed = JSON.parse(clean);
        } catch (e) {
          // ignore parse error
        }
      }

      try {
        if (method === 'POST' && url === '/api/register') {
          return AuthController.register(req, res, parsed);
        }
        if (method === 'POST' && url === '/api/login') {
          return AuthController.login(req, res, parsed);
        }
      } catch (e) {
        console.error('[authRoutes] error', e && e.message ? e.message : e);
        try { if (!res.headersSent) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ success: false })); } } catch (e2) {}
      }
    });
  });
}

module.exports = registerAuthRoutes;
