const authModel = require('../../authModel');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

class AdminAuthController {
  static async login(req, res, body) {
    try {
      const username = body && body.username;
      const password = body && body.password;

      if (!username || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'username and password required' }));
        return;
      }

      // Use legacy authModel to validate credentials
      let result;
      try {
        result = authModel.loginAdmin(username, password);
      } catch (e) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
        return;
      }

      // result contains adminId, username, fullname, token (legacy)
      const payload = { adminId: result.adminId, username: result.username, role: 'admin' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, admin: { adminId: result.adminId, username: result.username, fullname: result.fullname }, token }));
    } catch (e) {
      console.error('[AdminAuthController.login] Error', e && e.message ? e.message : e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
    }
  }
}

module.exports = AdminAuthController;
