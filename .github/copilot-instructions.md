<!-- Copilot / AI agent instructions for contributors working on this repo -->
# BVOX Finance — Assistant Instructions

This file is a short, actionable guide for AI coding agents (Copilot-style) to be immediately productive in this repository.

1) Big picture
- Frontend: static multi-page site (root HTML files, many per-page `*_files` folders and `Bvox_files`). See `index.html`, `js/`, and many `*_files/` directories.
- Dev static server: `server.js` — a custom Node HTTP server that serves static files and implements many legacy API endpoints used by the frontend (file fallbacks, `*_files` lookup, uploads directory handling).
- Backend API: `backend-server.js` — Express + MongoDB service for wallet auth, sessions, transactions and KYC. Uses `mongoose` and expects a `.env` with `MONGODB_URI`.
- Data storage: mixed approaches — some modules persist to JSON files (`users.json`, `wallets.json`, `trades_records.json`, etc.) while `backend-server.js` uses MongoDB. Inspect `*.json` files at repo root for examples.

2) How to run & debug (commands)
- Start static/dev server: `npm run start` (runs `node server.js`) or `node server.js` directly. `start.ps1` provides a PowerShell quick-start.
- Start backend API: `npm run backend` (runs `node backend-server.js`). Backend expects a `.env` (see `backend-server.js` for `MONGODB_URI` and `BACKEND_PORT`).
- Run both in development: `npm run dev:all` (uses `concurrently`).
- Install runtime deps: `npm run install:deps` (installs production dependencies declared in `package.json`).

3) Key patterns and pitfalls to know
- `server.js` contains a lot of legacy compatibility code:
  - It strips jQuery-appended query parts from POST bodies by looking for `}&` and truncating the payload before JSON.parse. Keep this pattern in mind when adding new POST handlers.
  - Static fallback logic: when files are missing, `server.js` searches any directory ending with `_files` for matching assets. When modifying static routes, mirror that behavior.
- The frontend sometimes expects the old API shape. There are two parallel APIs: the lightweight file-based endpoints in `server.js` (for local dev and legacy clients) and the Express/Mongo backend in `backend-server.js`. When changing an endpoint, check both locations.
- File uploads: `server.js` writes uploads to the `uploads/` folder and serves `/uploads/*`. Ensure correct path normalization and avoid path-traversal.
- Data formats: several endpoints reply in legacy shapes (e.g., `code:1` or objects with `success:true`). When implementing features, keep compatible response formats.

4) Important files to inspect (examples)
- `server.js` — dev static server and many `/api/*` legacy endpoints (top-up, withdrawal, exchange, wallet/connect, admin routes).
- `backend-server.js` — modern backend with MongoDB models (User, Transaction, Session, DeviceSession) and endpoints like `/auth/login-wallet`, `/wallet/get-or-create-user`.
- `package.json` — scripts and required Node version (>=14). Use `npm run dev:all` for running both servers.
- `js/config.js` and `js/` — frontend config and API baseURL used by pages.
- Example JSON stores: `users.json`, `wallets.json`, `admins.json`, `trades_records.json` — useful to see current data shapes.

5) Integration points & external dependencies
- Huobi WebSocket for real-time prices (`wss://api.huobi.pro/ws`) — seen in README and frontend code.
- Wallet integrations: `web3.js` / `ethers` / `walletconnect` usage in frontend modules and `backend-server.js` (ethers for signature verification).
- MongoDB for backend persistence — `MONGODB_URI` used by `backend-server.js` (local fallback to `mongodb://localhost:27017/bvox-finance`).

6) Quick editing rules for AI agents
- Preserve backward-compatible API shapes when updating endpoints in `server.js` — many frontend pages expect legacy responses.
- If adding endpoints, add tests or a README note and mirror any fallback/compat behavior implemented in `server.js`.
- When modifying static paths, search for `*_files` usage and ensure `server.js` fallback still finds assets.
- Avoid committing secrets — `.env` should contain DB credentials and should not be committed.

7) Helpful examples to copy/paste
- Start both servers (Windows PowerShell):
```powershell
cd "<repo-root>"
npm install
npm run dev:all
```
- Example API call (wallet connect) used by frontend: `POST /api/wallet/connect` with JSON body `{ "address": "0x...", "chainId": "ethereum" }` — implemented in `server.js`.

8) If you need more context
- Inspect `README.md` at repo root for high-level overview and Quick Start notes.
- Search for `get-or-create-user` and `wallet/get-or-create-user` to understand wallet login flow split between backend and legacy server.

Please review this draft and tell me if you want more examples (specific endpoints, more file references, or security notes). I'll iterate on feedback.
