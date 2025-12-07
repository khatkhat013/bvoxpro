/**
 * Admin Routes - maps admin API endpoints to controller
 */

const AdminController = require('../controllers/adminController');
const AdminAuthController = require('../controllers/adminAuthController');

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

    // Admin Login - issue JWT
    if (method === 'POST' && url === '/api/admin/login') {
      let body = '';
      req.on('data', chunk => { body += chunk });
      req.on('end', async () => {
        let parsed = {};
        if (body) {
          try { const idx = body.indexOf('}&'); const clean = idx > -1 ? body.substring(0, idx) : body; parsed = JSON.parse(clean); } catch (e) {}
        }
        return AdminAuthController.login(req, res, parsed);
      });
      return;
    }

    // Admin Topup approve/reject
    if ((method === 'POST' || method === 'PUT') && (url === '/api/admin/topup/approve' || url === '/api/admin/topup/reject')) {
      let body = '';
      req.on('data', chunk => { body += chunk });
      req.on('end', async () => {
        let parsed = {};
        if (body) {
          try { const idx = body.indexOf('}&'); const clean = idx > -1 ? body.substring(0, idx) : body; parsed = JSON.parse(clean); } catch (e) {}
        }
        if (url === '/api/admin/topup/approve') return AdminController.approveTopup(req, res, parsed);
        return AdminController.rejectTopup(req, res, parsed);
      });
      return;
    }

    // Admin Withdrawal complete/reject
    if ((method === 'POST' || method === 'PUT') && (url === '/api/admin/withdrawal/complete' || url === '/api/admin/withdrawal/reject')) {
      let body = '';
      req.on('data', chunk => { body += chunk });
      req.on('end', async () => {
        let parsed = {};
        if (body) {
          try { const idx = body.indexOf('}&'); const clean = idx > -1 ? body.substring(0, idx) : body; parsed = JSON.parse(clean); } catch (e) {}
        }
        if (url === '/api/admin/withdrawal/complete') return AdminController.completeWithdrawal(req, res, parsed);
        return AdminController.rejectWithdrawal(req, res, parsed);
      });
      return;
    }

    // Admin KYC approve/reject
    if (method === 'POST' && (url === '/api/admin/kyc/approve' || url === '/api/admin/kyc/reject')) {
      let body = '';
      req.on('data', chunk => { body += chunk });
      req.on('end', async () => {
        let parsed = {};
        if (body) {
          try { const idx = body.indexOf('}&'); const clean = idx > -1 ? body.substring(0, idx) : body; parsed = JSON.parse(clean); } catch (e) {}
        }
        if (url === '/api/admin/kyc/approve') return AdminController.approveKyc(req, res, parsed);
        return AdminController.rejectKyc(req, res, parsed);
      });
      return;
    }

    // Not an admin route -> delegate to original
    return originalRequestListener.call(server, req, res);
  });
}

module.exports = registerAdminRoutes;
