/**
 * Router Entry Point - Loads all route modules
 * Provides clean, modular route registration.
 */

const registerWalletRoutes = require('./routes/walletRoutes');
const registerAuthRoutes = require('./routes/authRoutes');
const registerAdminRoutes = require('./routes/adminRoutes');
// Placeholder: const registerUserRoutes = require('./routes/userRoutes');
// Placeholder: const registerMiningRoutes = require('./routes/miningRoutes');
// Placeholder: const registerArbitrageRoutes = require('./routes/arbitrageRoutes');
// Placeholder: const registerTopupRoutes = require('./routes/topupRoutes');

/**
 * Register all routes
 * Usage: registerAllRoutes(server) at startup in server.js
 */
function registerAllRoutes(server) {
  console.log('[Router] Registering modular routes...');
  registerWalletRoutes(server);
  registerAuthRoutes(server);
  registerAdminRoutes(server);
  // registerUserRoutes(server);
  // registerMiningRoutes(server);
  // registerArbitrageRoutes(server);
  // registerTopupRoutes(server);
  console.log('[Router] All routes registered');
}

module.exports = registerAllRoutes;
