/**
 * Admin Controller - HTTP handlers for admin endpoints
 */

const AdminService = require('../services/adminService');
const authModel = require('../../authModel');
const { requireAdmin } = require('../middleware/auth');

class AdminController {
  static async me(req, res) {
    try {
      const decoded = requireAdmin(req, res);
      if (!decoded) return; // requireAdmin already sent 403

      // If JWT provided adminId in decoded, use it; else use legacy decoded.adminId
      const adminId = decoded.adminId || decoded.adminId;
      const admin = authModel.getAdminById(adminId);
      if (!admin) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Admin not found' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, admin: { id: admin.id, fullname: admin.fullname, username: admin.username, email: admin.email, status: admin.status, created_at: admin.created_at, lastLogin: admin.lastLogin } }));
    } catch (e) {
      console.error('[AdminController.me] Error', e && e.message ? e.message : e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
    }
  }

  static async listAdmins(req, res) {
    try {
      const decoded = requireAdmin(req, res);
      if (!decoded) return;

      const admins = authModel.getAllAdmins();
      const safeAdmins = admins.map(a => ({ id: a.id, fullname: a.fullname, username: a.username, email: a.email, status: a.status, created_at: a.created_at, lastLogin: a.lastLogin }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, admins: safeAdmins }));
    } catch (e) {
      console.error('[AdminController.listAdmins] Error', e && e.message ? e.message : e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
    }
  }

  static async getAllUsers(req, res) {
    try {
      const decoded = requireAdmin(req, res);
      if (!decoded) return;

      const users = await AdminService.getAllUsers();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, users }));
    } catch (e) {
      console.error('[AdminController.getAllUsers] Error', e && e.message ? e.message : e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
    }
  }

  static async updateUserBalance(req, res, body) {
    try {
      const decoded = requireAdmin(req, res);
      if (!decoded) return;

      const { userId, coin, amount } = body || {};
      if (!userId || !coin || amount === undefined) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'userId, coin and amount are required' }));
        return;
      }

      const updated = await AdminService.updateUserBalance(userId, coin, amount);
      if (!updated) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'User not found' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, user: updated }));
    } catch (e) {
      console.error('[AdminController.updateUserBalance] Error', e && e.message ? e.message : e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
    }
  }

  static async approveTopup(req, res, body) {
    try {
      const decoded = requireAdmin(req, res);
      if (!decoded) return;
      const { id } = body || {};
      if (!id) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ code: 0, info: 'Missing id' })); return; }
      const result = await AdminService.approveTopup(id);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 1, info: 'Record approved successfully and balance updated', data: result }));
    } catch (err) {
      console.error('[AdminController.approveTopup] Error', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 0, info: err.message || 'Server error' }));
    }
  }

  static async rejectTopup(req, res, body) {
    try {
      const decoded = requireAdmin(req, res);
      if (!decoded) return;
      const { id, reason } = body || {};
      if (!id) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ code: 0, info: 'Missing id' })); return; }
      const result = await AdminService.rejectTopup(id, reason);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 1, info: 'Record rejected successfully', data: result }));
    } catch (err) {
      console.error('[AdminController.rejectTopup] Error', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 0, info: err.message || 'Server error' }));
    }
  }

  static async completeWithdrawal(req, res, body) {
    try {
      const decoded = requireAdmin(req, res);
      if (!decoded) return;
      const { id, txHash } = body || {};
      if (!id) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ code: 0, info: 'Missing id' })); return; }
      const result = await AdminService.completeWithdrawal(id, txHash);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 1, info: 'Record completed successfully and balance updated', data: result }));
    } catch (err) {
      console.error('[AdminController.completeWithdrawal] Error', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 0, info: err.message || 'Server error' }));
    }
  }

  static async rejectWithdrawal(req, res, body) {
    try {
      const decoded = requireAdmin(req, res);
      if (!decoded) return;
      const { id, reason } = body || {};
      if (!id) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ code: 0, info: 'Missing id' })); return; }
      const result = await AdminService.rejectWithdrawal(id, reason);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 1, info: 'Record rejected successfully', data: result }));
    } catch (err) {
      console.error('[AdminController.rejectWithdrawal] Error', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 0, info: err.message || 'Server error' }));
    }
  }

  static async approveKyc(req, res, body) {
    try {
      const decoded = requireAdmin(req, res);
      if (!decoded) return;
      const { id, reviewer } = body || {};
      if (!id) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ code: 0, data: 'Missing id' })); return; }
      const result = await AdminService.approveKyc(id, reviewer);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 1, data: 'KYC approved', record: result }));
    } catch (err) {
      console.error('[AdminController.approveKyc] Error', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 0, data: err.message || 'Server error' }));
    }
  }

  static async rejectKyc(req, res, body) {
    try {
      const decoded = requireAdmin(req, res);
      if (!decoded) return;
      const { id, reviewer, reason } = body || {};
      if (!id) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ code: 0, data: 'Missing id' })); return; }
      const result = await AdminService.rejectKyc(id, reviewer, reason);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 1, data: 'KYC rejected', record: result }));
    } catch (err) {
      console.error('[AdminController.rejectKyc] Error', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 0, data: err.message || 'Server error' }));
    }
  }
}

module.exports = AdminController;
