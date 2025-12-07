const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

/**
 * Verify JWT token from request Authorization header.
 * Returns decoded payload if valid, otherwise throws.
 */
function verifyTokenFromRequest(req) {
  const header = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (!header || typeof header !== 'string') throw new Error('Missing Authorization header');
  if (!header.startsWith('Bearer ')) throw new Error('Invalid Authorization header');
  const token = header.split(' ')[1];
  if (!token) throw new Error('Token missing');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (e) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Convenience to require auth in controllers: returns decoded payload or writes 401 and returns null
 */
function requireAuth(req, res) {
  try {
    const decoded = verifyTokenFromRequest(req);
    return decoded;
  } catch (e) {
    try {
      if (!res.headersSent) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    } catch (e2) {}
    return null;
  }
}

module.exports = { verifyTokenFromRequest, requireAuth };

// Require admin: accept JWT (with role/adminId) OR legacy admin token (authModel.verifyToken)
const authModel = require('../../authModel');
const adminModel = require('../../admin/adminModel');

function requireAdmin(req, res) {
  // Try JWT first
  try {
    const decoded = verifyTokenFromRequest(req);
    // Check role or adminId
    if (decoded && (decoded.role === 'admin' || decoded.adminId)) {
      return decoded;
    }
    // Not admin
  } catch (e) {
    // ignore and try legacy admin token
  }

  // Try legacy admin token from Authorization header
  try {
    const header = req.headers && (req.headers.authorization || req.headers.Authorization);
    if (!header || !header.startsWith('Bearer ')) {
      throw new Error('Admin token missing');
    }
    const token = header.split(' ')[1];
    const decodedLegacy = authModel.verifyToken(token);
    if (!decodedLegacy || !decodedLegacy.adminId) throw new Error('Invalid admin token');
    // Fetch admin to ensure exists
    const admin = authModel.getAdminById(decodedLegacy.adminId);
    if (!admin) throw new Error('Admin not found');
    // Return a normalized decoded object
    return { adminId: decodedLegacy.adminId, username: admin.username, fullname: admin.fullname };
  } catch (e) {
    try {
      if (!res.headersSent) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Admin authorization required' }));
      }
    } catch (e2) {}
    return null;
  }
}

module.exports = { verifyTokenFromRequest, requireAuth, requireAdmin };
