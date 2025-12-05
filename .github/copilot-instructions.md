<!-- Copilot / AI agent instructions for contributors working on this repo -->
# BVOX Finance — Assistant Instructions

Essential knowledge for immediately productive AI coding work on this multi-service cryptocurrency trading platform.

## 1. System Architecture

**Triple-server design** (each solves a specific problem):

| Server | Purpose | Tech | Port | When to use |
|--------|---------|------|------|-------------|
| `server.js` | Static assets + legacy REST API | Raw `http` module, no dependencies | 3000 | Page assets, wallet connect, topup/withdrawal records |
| `backend-server.js` | Modern auth & MongoDB backend | Express.js, Mongoose | 5000 | WalletConnect sig verification, user creation, KYC approval |
| `trading-system/server.js` | Prediction trading platform | Express.js, Mongoose, settlement engine | 3001 | Price prediction trades, real-time settlement |

**Frontend (root HTML pages)**:
- `index.html`, `mining.html`, `contract.html`, `ai-arbitrage.html`, `loan.html`, `kyc1.html`, `kyc2.html`, etc.
- Each page's assets in `<page>_files/` (e.g., `mining.html` → `mining_files/`)
- Shared: `Bvox_files/`, `js/`, `img/`, `lang/` (for i18n)

**Data layer (three backends)**:
- **JSON files**: `users.json`, `wallets.json`, `*_records.json`, `*_subscriptions.json` (managed by `*Model.js` files)
- **MongoDB**: Trading system trades, users, wallets, coins (isolated in `trading-system/`)
- **Admin panel**: `admin/` folder (separate Express app; uses JSON files from root)

## 2. Critical Patterns

### Request body parsing in server.js
jQuery appends query strings to POST bodies. **Always truncate before parsing**:
```javascript
let body = ''
req.on('data', chunk => { body += chunk })
req.on('end', () => {
  const idx = body.indexOf('}&')
  const cleanBody = idx > -1 ? body.substring(0, idx) : body
  const data = JSON.parse(cleanBody)
})
```

### Static asset resolution
Missing file? `server.js` auto-searches `*_files/` folders. Missing `/css/main.css` → checks `mining_files/`, `contract_files/`, `Bvox_files/`.

### Dual feature endpoints
**When adding a feature, check BOTH servers**:
- `server.js`: Legacy JSON-file-based version (e.g., `/api/wallet/connect`)
- `backend-server.js`: Modern MongoDB + sig-verify version (e.g., `/auth/login-wallet`)
- Both must coexist; frontend pages may hit either

### Data model file pattern
All `*Model.js` files follow: read JSON → mutate → write JSON:
```javascript
function save(record) {
  const records = loadRecords() // read from disk
  records.push(record)
  saveRecords(records) // write atomically
  return record
}
```
**Warning**: No transactions—file I/O only. For critical operations (trades), use MongoDB in `trading-system/`.

### User ID generation
`walletModel.js` generates incrementing numeric IDs starting from 342016. Check `generateNextUserId()` before manual ID assignment.

### Multi-language support
Translations in `lang/` folder: `en.json`, `cn.json`, `es.json`, `fr.json`, `de.json`, `jp.json`, `kr.json`, `in.json`, `pt.json`.

## 3. Key Files Reference

| File | Purpose | Key exports |
|------|---------|-------------|
| `server.js` | Static HTTP + legacy `/api/*` | Core request routing, settlement scheduler |
| `backend-server.js` | Express + MongoDB for modern endpoints | `/auth/*`, `/wallet/*`, KYC approval |
| `walletModel.js` | Wallet connect, UID generation | `connectWallet()`, `generateNextUserId()` |
| `arbitrageModel.js` | AI arbitrage subscription engine | `createArbitrageSubscription()`, `settleArbitrageSubscriptions()` |
| `topupRecordModel.js`, `exchangeRecordModel.js`, etc. | JSON-file data persistence | `save()`, `loadRecords()` |
| `adminModel.js` | Admin aggregation across all files | `getAllUsers()`, `updateUserBalance()` |
| `authModel.js` | Admin login/JWT tokens (legacy) | `loginAdmin()`, `verifyToken()` |
| `trading-system/models.js` | Trading system schemas | User, Wallet, Coin, Trade, Prediction |
| `trading-system/settlementEngine.js` | Auto-settle due trades | `settleDueOpenTrades()` |
| `js/config.js` | Global config constants | `CRYPTOCURRENCIES`, `API_CONFIG`, `WS_CONFIG` |

## 4. Environment Setup

**.env file** (required for backends):
```
MONGODB_URI=mongodb://localhost:27017/bvox-finance
BACKEND_PORT=5000
TRADING_SYSTEM_MONGO_URI=mongodb://localhost:27017/trading-system
JWT_SECRET=<32+ chars>
FRONTEND_URL=http://localhost:3000
```

**Quick start**:
```powershell
npm install
npm run dev:all  # Starts server.js (3000) + backend-server.js (5000)
cd trading-system; npm start  # Separate terminal: trading-system (3001)
```

## 5. Data Schemas

**User (JSON `users.json`, maintained by `walletModel.js`)**:
```json
{ "userid": "342016", "address": "0x...", "balances": { "usdt": 100, "btc": 0.5 }, "kycStatus": "pending" }
```

**Transaction Record (JSON `topup_records.json`, etc., managed by `topupRecordModel.js`)**:
```json
{ "user_id": "342016", "amount": 100, "coin": "usdt", "timestamp": 1234567890, "status": "completed" }
```

**Arbitrage Subscription (JSON `arbitrage_subscriptions.json`)**:
```json
{ "userId": "342016", "productId": "p1", "subscriptionDate": 1234567890, "maturityDate": 1234567950, "settled": false, "won": null }
```

## 6. Editing Rules

1. **Response shape consistency**: Legacy `/api/*` endpoints use `{ success: true, user: {...} }`. Modern `/auth/*` uses `{ status: 200, message: "...", data: {...} }`. Keep endpoint responses unchanged or update ALL dependent pages.
2. **File I/O atomicity**: JSON models don't support transactions. Use MongoDB in `trading-system/` for critical operations (e.g., trades that must be all-or-nothing).
3. **Wallet authentication**: `backend-server.js` uses `ethers.recoverAddress()` to verify wallet signatures; `server.js` uses file-based admin tokens.
4. **Adding endpoints**: If feature touches wallet or transactions, implement in **both** `server.js` (legacy) and `backend-server.js` (modern) unless intentionally legacy-only.
5. **Cryptocurrency support**: Add coins to `js/config.js:CRYPTOCURRENCIES`, then to balance fields in `userSchema` (backend) and JSON defaults (server.js).

## 7. Common Debugging

**Wallet connection fails**:
- Check `walletModel.js` for UID generation logic (starts at 342016)
- Verify address case-sensitivity (most chains are case-insensitive, but code may differ)
- Inspect `wallets.json` and `users.json` for stale entries; restart to clear file cache

**KYC approval not working**:
- `server.js` endpoint: `/api/admin/kyc/approve` (POST) — verify `X-Admin-ID` header via `authModel.js`
- Admins stored in `admins.json`; ensure user has admin record

**Arbitrage settlement stuck**:
- `settleDueOpenTrades()` runs every 60s in `server.js`
- Check `arbitrage_subscriptions.json` for `maturityDate < now()` + `settled: false`
- Manually trigger: call `settleArbitrageSubscriptions()` in REPL or restart server

**Trading system trades not settling**:
- `trading-system/server.js`: Settlement runs every 10s
- Verify MongoDB connection; check `trade` collection for `status: "OPEN"` + `settlementTime < now()`
