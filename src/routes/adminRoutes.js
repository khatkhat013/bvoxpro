/**
 * Admin Routes - maps admin API endpoints to controller
 */

const AdminController = require('../controllers/adminController');

function registerAdminRoutes(server) {
  const originalRequestListener = server.listeners('request')[0];
  if (!originalRequestListener) return;

  // Remove original and wrap
  server.removeListener('request', originalRequestListener);

  server.on('request', (req, res) => {
    const { method, url } = req;

    // Admin GET endpoints
    if (method === 'GET' && (url === '/api/admin/me' || url === '/api/admin/list' || url === '/api/admin/users')) {
      // Delegate to original only when needed
      try {
        if (url === '/api/admin/me') return AdminController.me(req, res);
        if (url === '/api/admin/list') return AdminController.listAdmins(req, res);
        if (url === '/api/admin/users') return AdminController.getAllUsers(req, res);
      } catch (e) {
        console.error('[adminRoutes] handler error', e && e.message ? e.message : e);
        try { if (!res.headersSent) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ success: false })); } } catch (e2) {}
      }
      return;
    }

    // Admin POST endpoints
    if (method === 'POST' && url === '/api/admin/update-balance') {
      let body = '';
      req.on('data', chunk => { body += chunk });
      req.on('end', async () => {
        let parsed = {};
        if (body) {
          try { const idx = body.indexOf('}&'); const clean = idx > -1 ? body.substring(0, idx) : body; parsed = JSON.parse(clean); } catch (e) {}
        }
        return AdminController.updateUserBalance(req, res, parsed);
      });
      return;
    }

    // Not an admin route -> delegate to original
    return originalRequestListener.call(server, req, res);
  });
}

module.exports = registerAdminRoutes;
