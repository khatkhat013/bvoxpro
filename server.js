// NOTE: The file uses a single `http.createServer` routing approach below.
// The legacy Express-style `app.post` usage was removed and the same
// functionality is implemented inside the server routing further down.
/**
 * Simple Development Server for BVOX Finance
 * Serves static files and handles CORS
 * 
 * Usage: node server.js
 */

const http = require('http');
const { registerUser } = require('./userModel');
const { saveTopupRecord, getUserTopupRecords } = require('./topupRecordModel');
const { saveWithdrawalRecord, getUserWithdrawalRecords } = require('./withdrawalRecordModel');
const { saveExchangeRecord, getUserExchangeRecords } = require('./exchangeRecordModel');
const { getAllUsers, getUserById, updateUserBalance, getUserStats, addTopupRecord, addWithdrawalRecord, deleteTransaction } = require('./adminModel');
const { registerAdmin, loginAdmin, getAdminById, verifyToken } = require('./authModel');
const { getAllArbitrageProducts, getArbitrageProductById, createArbitrageSubscription, getUserArbitrageSubscriptions, getUserArbitrageStats } = require('./arbitrageModel');
const { connectWallet, verifyWallet, getWalletByUID, getUserByUID, getWalletByAddress } = require('./walletModel');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.download': 'text/javascript', // .download files are typically JS
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

// Create HTTP Server
const server = http.createServer((req, res) => {
    try {
        // Parse the request URL first
        const parsedUrl = url.parse(req.url, true);
        let pathname = parsedUrl.pathname;

        // Add CORS headers FIRST - before any other response
        const origin = req.headers.origin || '*';
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Handle user registration (wallet connect)
        if (pathname === '/api/register' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    // Extract fields from request
                    const address = data.address;
                    const session = data.session || uuidv4();
                    const token = data.token || uuidv4();
                    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                    const user_agent = req.headers['user-agent'] || '';
                    if (!address) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Missing address' }));
                        return;
                    }
                    const user = registerUser({ address, session, token, ip, user_agent });
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, user }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid request', details: e.message }));
                }
            });
            return;
        }

    // Handle top-up record save (POST)
    if (pathname === '/api/topup-record' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                // Remove any query parameters appended by jQuery beforeSend
                // e.g., "&yanzheng=...", "&token=...", "&address=...", "&sid=..."
                let jsonBody = body;
                if (body.includes('}&')) {
                    // JSON ends at the first '}', extract it
                    jsonBody = body.substring(0, body.indexOf('}&') + 1);
                }
                
                console.error('[topup-record] Raw body:', body.substring(0, 200));
                console.error('[topup-record] Cleaned body:', jsonBody.substring(0, 200));
                
                const data = JSON.parse(jsonBody);
                console.error('[topup-record] ✓ Parsed:', JSON.stringify(data).substring(0, 100));
                const { user_id, coin, address, photo_url, amount } = data;
                
                if (!user_id || !coin || !address || !photo_url || !amount) {
                    console.error('[topup-record] ✗ Missing field');
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing required fields' }));
                    return;
                }
                
                console.error('[topup-record] ✓ Saving record...');
                const record = saveTopupRecord({ user_id, coin, address, photo_url, amount });
                console.error('[topup-record] ✓ Saved:', record.id);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, record }));
            } catch (e) {
                console.error('[topup-record] ✗ Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // Get user's top-up records (GET)
    if (pathname === '/api/topup-records' && req.method === 'GET') {
        const queryParams = url.parse(req.url, true).query;
        const user_id = queryParams.user_id;
        if (!user_id) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing user_id parameter' }));
            return;
        }
        const records = getUserTopupRecords(user_id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, records }));
        return;
    }

    // Handle withdrawal record save (POST)
    if (pathname === '/api/withdrawal-record' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                // Remove any query parameters appended by jQuery beforeSend
                let jsonBody = body;
                if (body.includes('}&')) {
                    jsonBody = body.substring(0, body.indexOf('}&') + 1);
                }
                
                console.error('[withdrawal-record] Raw body:', body.substring(0, 200));
                console.error('[withdrawal-record] Cleaned body:', jsonBody.substring(0, 200));
                
                const data = JSON.parse(jsonBody);
                console.error('[withdrawal-record] ✓ Parsed:', JSON.stringify(data).substring(0, 100));
                const { user_id, coin, address, quantity } = data;
                
                if (!user_id || !coin || !address || !quantity) {
                    console.error('[withdrawal-record] ✗ Missing field');
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing required fields' }));
                    return;
                }
                
                console.error('[withdrawal-record] ✓ Saving record...');
                const record = saveWithdrawalRecord({ user_id, coin, address, quantity, status: 'pending' });
                console.error('[withdrawal-record] ✓ Saved:', record.id);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, record }));
            } catch (e) {
                console.error('[withdrawal-record] ✗ Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // Get user's withdrawal records (GET)
    if (pathname === '/api/withdrawal-records' && req.method === 'GET') {
        const queryParams = url.parse(req.url, true).query;
        const user_id = queryParams.user_id;
        if (!user_id) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing user_id parameter' }));
            return;
        }
        const records = getUserWithdrawalRecords(user_id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, records }));
        return;
    }

    // Handle exchange record save (POST)
    if (pathname === '/api/exchange-record' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                // Remove any query parameters appended by jQuery beforeSend
                let jsonBody = body;
                if (body.includes('}&')) {
                    jsonBody = body.substring(0, body.indexOf('}&') + 1);
                }
                
                console.error('[exchange-record] Raw body:', body.substring(0, 200));
                console.error('[exchange-record] Cleaned body:', jsonBody.substring(0, 200));
                
                const data = JSON.parse(jsonBody);
                console.error('[exchange-record] ✓ Parsed:', JSON.stringify(data).substring(0, 100));
                const { user_id, from_coin, to_coin, from_amount, to_amount, status } = data;
                
                if (!user_id || !from_coin || !to_coin || !from_amount || !to_amount) {
                    console.error('[exchange-record] ✗ Missing field');
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing required fields' }));
                    return;
                }
                
                console.error('[exchange-record] ✓ Saving record...');
                const record = saveExchangeRecord({ user_id, from_coin, to_coin, from_amount, to_amount, status: status || 'completed' });
                console.error('[exchange-record] ✓ Saved:', record.id);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, record }));
            } catch (e) {
                console.error('[exchange-record] ✗ Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // Get user's exchange records (GET)
    if (pathname === '/api/exchange-records' && req.method === 'GET') {
        const queryParams = url.parse(req.url, true).query;
        const user_id = queryParams.user_id;
        if (!user_id) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing user_id parameter' }));
            return;
        }
        const records = getUserExchangeRecords(user_id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, records }));
        return;
    }

    // WALLET API ENDPOINTS
    
    // Get wallet balance (GET) - accept ?userid= for browser/direct requests
    if ((pathname === '/api/Wallet/getbalance' || pathname === '/api/wallet/getbalance') && req.method === 'GET') {
        try {
            const queryParams = url.parse(req.url, true).query;
            const userid = queryParams.userid || queryParams.user_id;

            if (!userid) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: 0, error: 'Missing userid parameter', success: false }));
                return;
            }

            const user = getUserById(userid);
            if (!user) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: 0, error: 'User not found', success: false }));
                return;
            }

            const balanceData = {
                code: 1,
                success: true,
                data: {
                    usdt: user.usdt || 0,
                    btc: user.btc || 0,
                    eth: user.eth || 0,
                    usdc: user.usdc || 0,
                    pyusd: user.pyusd || 0,
                    sol: user.sol || 0
                }
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(balanceData));
        } catch (e) {
            console.error('[wallet-getbalance-GET] Error:', e.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ code: 0, error: e.message, success: false }));
        }
        return;
    }

    // Get wallet balance (POST) - Compatible with original API format
    if ((pathname === '/api/Wallet/getbalance' || pathname === '/api/wallet/getbalance') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                let jsonBody = body;
                if (body.includes('}&')) {
                    jsonBody = body.substring(0, body.indexOf('}&') + 1);
                }

                // Try to parse JSON first, fall back to urlencoded (jQuery default)
                let data;
                try {
                    data = JSON.parse(jsonBody);
                } catch (parseErr) {
                    data = {};
                    // parse x-www-form-urlencoded like: userid=123&foo=bar
                    jsonBody.split('&').forEach(pair => {
                        if (!pair) return;
                        const parts = pair.split('=');
                        const key = decodeURIComponent(parts[0] || '').trim();
                        const val = decodeURIComponent((parts[1] || '').replace(/\+/g, ' ')).trim();
                        if (key) data[key] = val;
                    });
                }
                const userid = data.userid || data.user_id;
                
                if (!userid) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ code: 0, error: 'Missing userid parameter', success: false }));
                    return;
                }
                
                // Get user from database
                const user = getUserById(userid);
                
                if (!user) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ code: 0, error: 'User not found', success: false }));
                    return;
                }
                
                // Return balance data in original API format
                const balanceData = {
                    code: 1,
                    success: true,
                    data: {
                        usdt: user.usdt || 0,
                        btc: user.btc || 0,
                        eth: user.eth || 0,
                        usdc: user.usdc || 0,
                        pyusd: user.pyusd || 0,
                        sol: user.sol || 0
                    }
                };
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(balanceData));
            } catch (e) {
                console.error('[wallet-getbalance] Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: 0, error: e.message, success: false }));
            }
        });
        return;
    }

    // ADMIN AUTHENTICATION ENDPOINTS

    // Admin Login
    if (pathname === '/api/admin/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                let jsonBody = body;
                if (body.includes('}&')) {
                    jsonBody = body.substring(0, body.indexOf('}&') + 1);
                }

                const data = JSON.parse(jsonBody);
                const { username, password } = data;

                if (!username || !password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Username and password required' }));
                    return;
                }

                const result = loginAdmin(username, password);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, ...result }));
            } catch (e) {
                console.error('[admin-login] Error:', e.message);
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // Admin Register
    if (pathname === '/api/admin/register' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                let jsonBody = body;
                if (body.includes('}&')) {
                    jsonBody = body.substring(0, body.indexOf('}&') + 1);
                }

                const data = JSON.parse(jsonBody);
                const { fullname, username, email, password } = data;

                if (!fullname || !username || !email || !password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'All fields required' }));
                    return;
                }

                const admin = registerAdmin(fullname, username, email, password);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Admin registered successfully', admin: { id: admin.id, username: admin.username, email: admin.email } }));
            } catch (e) {
                console.error('[admin-register] Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // ADMIN API ENDPOINTS
    
    // Get all users (admin)
    if (pathname === '/api/admin/users' && req.method === 'GET') {
        const users = getAllUsers();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, users }));
        return;
    }

    // Get user details and stats (admin)
    if (pathname === '/api/admin/user-stats' && req.method === 'GET') {
        const queryParams = url.parse(req.url, true).query;
        const userId = queryParams.user_id;
        
        if (!userId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing user_id parameter' }));
            return;
        }

        const user = getUserById(userId);
        const stats = getUserStats(userId);

        if (!user) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user, stats }));
        return;
    }

    // Update user balance (admin)
    if (pathname === '/api/admin/update-balance' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                let jsonBody = body;
                if (body.includes('}&')) {
                    jsonBody = body.substring(0, body.indexOf('}&') + 1);
                }

                const data = JSON.parse(jsonBody);
                const { user_id, coin, amount } = data;

                if (!user_id || !coin || amount === undefined) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing required fields' }));
                    return;
                }

                const updatedUser = updateUserBalance(user_id, coin, amount);

                if (!updatedUser) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'User not found' }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, user: updatedUser }));
            } catch (e) {
                console.error('[admin-update-balance] Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // Add topup record for user (admin)
    if (pathname === '/api/admin/add-topup' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                let jsonBody = body;
                if (body.includes('}&')) {
                    jsonBody = body.substring(0, body.indexOf('}&') + 1);
                }

                const data = JSON.parse(jsonBody);
                const { user_id, coin, amount } = data;

                if (!user_id || !coin || !amount) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing required fields' }));
                    return;
                }

                const record = addTopupRecord(user_id, coin, amount);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, record }));
            } catch (e) {
                console.error('[admin-add-topup] Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

            // Approve top-up: update status and add to user balance (admin)
            if (pathname === '/api/admin/approve-topup' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', () => {
                    try {
                        // Handle legacy jQuery body format
                        if (body.includes('}&')) body = body.substring(0, body.indexOf('}&') + 1);
                        const data = JSON.parse(body);
                        const { topupId, amount } = data;
                        if (!topupId || !amount) {
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, error: 'Missing topupId or amount' }));
                            return;
                        }

                        const topupRecordsPath = './topup_records.json';
                        const usersPath = './users.json';
                        let topupRecords = [];
                        let users = [];
                        if (fs.existsSync(topupRecordsPath)) {
                            topupRecords = JSON.parse(fs.readFileSync(topupRecordsPath));
                        }
                        if (fs.existsSync(usersPath)) {
                            users = JSON.parse(fs.readFileSync(usersPath));
                        }

                        const topup = topupRecords.find(r => r.id === topupId);
                        if (!topup) {
                            res.writeHead(404, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, error: 'Topup record not found' }));
                            return;
                        }
                        if (topup.status === 'complete') {
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, error: 'Already completed' }));
                            return;
                        }

                        // Mark complete and update user balance
                        topup.status = 'complete';
                        const user = users.find(u => u.id === topup.user_id);
                        if (!user) {
                            res.writeHead(404, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, error: 'User not found' }));
                            return;
                        }

                        user.balance = (parseFloat(user.balance) || 0) + parseFloat(amount);

                        fs.writeFileSync(topupRecordsPath, JSON.stringify(topupRecords, null, 2));
                        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, newBalance: user.balance }));
                    } catch (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: err.message }));
                    }
                });
                return;
            }

    // Add withdrawal record for user (admin)
    if (pathname === '/api/admin/add-withdrawal' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                let jsonBody = body;
                if (body.includes('}&')) {
                    jsonBody = body.substring(0, body.indexOf('}&') + 1);
                }

                const data = JSON.parse(jsonBody);
                const { user_id, coin, address, quantity } = data;

                if (!user_id || !coin || !address || !quantity) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing required fields' }));
                    return;
                }

                const record = addWithdrawalRecord(user_id, coin, address, quantity);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, record }));
            } catch (e) {
                console.error('[admin-add-withdrawal] Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // Delete transaction (admin)
    if (pathname === '/api/admin/delete-transaction' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                let jsonBody = body;
                if (body.includes('}&')) {
                    jsonBody = body.substring(0, body.indexOf('}&') + 1);
                }

                const data = JSON.parse(jsonBody);
                const { transaction_type, transaction_id } = data;

                if (!transaction_type || !transaction_id) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing required fields' }));
                    return;
                }

                const success = deleteTransaction(transaction_type, transaction_id);

                if (!success) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Transaction not found' }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Transaction deleted' }));
            } catch (e) {
                console.error('[admin-delete] Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // ARBITRAGE API ENDPOINTS

    // Get all arbitrage products
    if (pathname === '/api/arbitrage/products' && req.method === 'GET') {
        const products = getAllArbitrageProducts();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, products }));
        return;
    }

    // Get arbitrage product by ID
    if (pathname.match(/^\/api\/arbitrage\/product\/[\w-]+$/)) {
        const productId = pathname.split('/').pop();
        const product = getArbitrageProductById(productId);

        if (!product) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Product not found' }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, product }));
        return;
    }

    // Create arbitrage subscription
    if (pathname === '/api/arbitrage/subscribe' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                let jsonBody = body;
                if (body.includes('}&')) {
                    jsonBody = body.substring(0, body.indexOf('}&') + 1);
                }

                const data = JSON.parse(jsonBody);
                const { user_id, product_id, amount } = data;

                if (!user_id || !product_id || !amount) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing required fields' }));
                    return;
                }

                const subscription = createArbitrageSubscription(user_id, product_id, amount);

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, subscription }));
            } catch (e) {
                console.error('[arbitrage-subscribe] Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // Get user arbitrage subscriptions
    if (pathname.match(/^\/api\/arbitrage\/subscriptions\?user_id=/)) {
        const queryParams = url.parse(pathname, true).query;
        const userId = queryParams.user_id;

        if (!userId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing user_id parameter' }));
            return;
        }

        const subscriptions = getUserArbitrageSubscriptions(userId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, subscriptions }));
        return;
    }

    // Get user arbitrage statistics
    if (pathname.match(/^\/api\/arbitrage\/stats\?user_id=/)) {
        const queryParams = url.parse(pathname, true).query;
        const userId = queryParams.user_id;

        if (!userId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing user_id parameter' }));
            return;
        }

        const stats = getUserArbitrageStats(userId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, stats }));
        return;
    }

    // TRADE API ENDPOINTS

    // Trade/Buy endpoint - create a new trade order
    if (pathname === '/api/trade/buy' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                let jsonBody = body;
                if (body.includes('}&')) {
                    jsonBody = body.substring(0, body.indexOf('}&') + 1);
                }

                const data = JSON.parse(jsonBody);
                const { userid, username, fangxiang, miaoshu, biming, num, buyprice, zengjia, jianshao } = data;

                if (!userid || !username || !biming || !num || !buyprice) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ code: 0, data: 'Missing required fields' }));
                    return;
                }

                // Create trade record
                const tradeRecord = {
                    id: Date.now().toString(),
                    userid,
                    username,
                    biming,
                    fangxiang: fangxiang == 1 ? 'upward' : 'downward',
                    miaoshu,
                    num,
                    buyprice,
                    zengjia,
                    jianshao,
                    status: 'pending',
                    created_at: new Date().toISOString()
                };

                // Save to trades records file
                const tradesFilePath = path.join(__dirname, 'trades_records.json');
                let tradesData = [];
                if (fs.existsSync(tradesFilePath)) {
                    const fileContent = fs.readFileSync(tradesFilePath, 'utf-8');
                    try {
                        tradesData = JSON.parse(fileContent);
                    } catch (e) {
                        tradesData = [];
                    }
                }

                tradesData.push(tradeRecord);
                fs.writeFileSync(tradesFilePath, JSON.stringify(tradesData, null, 2));

                console.error('[trade-buy] ✓ Trade record saved:', tradeRecord.id);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: 1, data: tradeRecord.id }));
            } catch (e) {
                console.error('[trade-buy] ✗ Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: 0, data: e.message }));
            }
        });
        return;
    }

    // Get trade list - proxy to external API
    if (pathname === '/api/Trade/gettradlist' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                // Forward request to external API
                const externalApiUrl = 'https://api.bvoxf.com/api/Trade/gettradlist';
                const https = require('https');
                const externalReq = https.request(externalApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': Buffer.byteLength(body)
                    }
                }, (externalRes) => {
                    let responseData = '';
                    externalRes.on('data', chunk => { responseData += chunk; });
                    externalRes.on('end', () => {
                        res.writeHead(externalRes.statusCode, { 'Content-Type': 'application/json' });
                        res.end(responseData);
                    });
                });

                externalReq.on('error', (err) => {
                    console.error('[gettradlist] External API error:', err.message);
                    res.writeHead(503, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ code: 0, data: 'External API unavailable' }));
                });

                externalReq.write(body);
                externalReq.end();
            } catch (e) {
                console.error('[gettradlist] Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: 0, data: e.message }));
            }
        });
        return;
    }

    // Get coin data - proxy to external API
    if (pathname === '/api/Trade/getcoin_data' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                // Forward request to external API
                const externalApiUrl = 'https://api.bvoxf.com/api/Trade/getcoin_data';
                const https = require('https');
                const externalReq = https.request(externalApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': Buffer.byteLength(body)
                    }
                }, (externalRes) => {
                    let responseData = '';
                    externalRes.on('data', chunk => { responseData += chunk; });
                    externalRes.on('end', () => {
                        res.writeHead(externalRes.statusCode, { 'Content-Type': 'application/json' });
                        res.end(responseData);
                    });
                });

                externalReq.on('error', (err) => {
                    console.error('[getcoin_data] External API error:', err.message);
                    res.writeHead(503, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ code: 0, data: 'External API unavailable' }));
                });

                externalReq.write(body);
                externalReq.end();
            } catch (e) {
                console.error('[getcoin_data] Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: 0, data: e.message }));
            }
        });
        return;
    }

    // Get all coin data used by frontend (Wallet/getcoin_all_data)
    if ((pathname === '/api/Wallet/getcoin_all_data' || pathname === '/api/wallet/getcoin_all_data') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                // Use the new external endpoint for coin price data
                const externalApiUrls = [
                    'https://api.bitcryptoforest.com/api/kline/getAllProduct'
                ];

                const https = require('https');

                const tryProxy = (index) => {
                    if (index >= externalApiUrls.length) {
                        // External APIs unavailable — return a small local fallback dataset
                        const sampleData = [
                            { symbol: 'btcusdt', close: 30000 },
                            { symbol: 'ethusdt', close: 2000 },
                            { symbol: 'usdcusdt', close: 1 },
                            { symbol: 'pyusdusdt', close: 1 },
                            { symbol: 'solusdt', close: 20 }
                        ];

                        const fallback = {
                            code: 1,
                            data: {
                                data: sampleData
                            }
                        };

                        console.warn('[getcoin_all_data] External APIs down — returning local fallback prices');
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(fallback));
                        return;
                    }

                    const externalApiUrl = externalApiUrls[index];
                    // Only log errors and fallbacks, not routine proxy requests
                    const externalReq = https.request(externalApiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Content-Length': Buffer.byteLength(body)
                        }
                    }, (externalRes) => {
                        let responseData = '';
                        externalRes.on('data', chunk => { responseData += chunk; });
                        externalRes.on('end', () => {
                            // Log external response status and a truncated body for diagnostics


                            // If external returns 200, forward it; otherwise try next
                            if (externalRes.statusCode >= 200 && externalRes.statusCode < 300) {
                                res.writeHead(externalRes.statusCode, { 'Content-Type': 'application/json' });
                                res.end(responseData);
                            } else {
                                // Only log non-200 responses
                                try {
                                    const snippet = responseData ? responseData.substring(0, 300) : '';
                                    console.error('[getcoin_all_data] External response error from', externalApiUrl, 'status=', externalRes.statusCode, 'bodySnippet=', snippet.replace(/\n/g, '\\n'));
                                } catch (logErr) {
                                    console.error('[getcoin_all_data] Error logging external response:', logErr.message);
                                }
                                tryProxy(index + 1);
                            }
                        });
                    });

                    externalReq.on('error', (err) => {
                        console.error('[getcoin_all_data] External request error for', externalApiUrl, ':', err.message);
                        tryProxy(index + 1);
                    });

                    externalReq.write(body);
                    externalReq.end();
                };

                tryProxy(0);
            } catch (e) {
                console.error('[getcoin_all_data] Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: 0, data: e.message }));
            }
        });
        return;
    }

    // Get order status
    if (pathname === '/api/trade/getorder' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const orderId = data.id;

                // Get trade record from file
                const tradesFilePath = path.join(__dirname, 'trades_records.json');
                let orderStatus = 0; // Default: unspecified
                
                if (fs.existsSync(tradesFilePath)) {
                    const fileContent = fs.readFileSync(tradesFilePath, 'utf-8');
                    const tradesData = JSON.parse(fileContent);
                    const trade = tradesData.find(t => t.id === orderId);
                    
                    if (trade && trade.status) {
                        if (trade.status === 'win') orderStatus = 1;
                        else if (trade.status === 'loss') orderStatus = 2;
                    }
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: 1, data: orderStatus }));
            } catch (e) {
                console.error('[getorder] Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: 0, data: e.message }));
            }
        });
        return;
    }

    // Set order result (win/loss)
    if (pathname === '/api/trade/setordersy' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const orderId = data.id;
                const shuying = data.shuying; // 1 = win, 2 = loss

                // Update trade record
                const tradesFilePath = path.join(__dirname, 'trades_records.json');
                if (fs.existsSync(tradesFilePath)) {
                    const fileContent = fs.readFileSync(tradesFilePath, 'utf-8');
                    let tradesData = JSON.parse(fileContent);
                    
                    const trade = tradesData.find(t => t.id === orderId);
                    if (trade) {
                        trade.status = shuying === 1 ? 'win' : 'loss';
                        trade.updated_at = new Date().toISOString();
                        fs.writeFileSync(tradesFilePath, JSON.stringify(tradesData, null, 2));
                    }
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: 1, data: 'Order updated' }));
            } catch (e) {
                console.error('[setordersy] Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: 0, data: e.message }));
            }
        });
        return;
    }

    // Get order result/profit
    if (pathname === '/api/trade/getorderjs' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const orderId = data.id;

                // Get trade record from file
                const tradesFilePath = path.join(__dirname, 'trades_records.json');
                let profit = 'wjs'; // 'wjs' = waiting, default
                
                if (fs.existsSync(tradesFilePath)) {
                    const fileContent = fs.readFileSync(tradesFilePath, 'utf-8');
                    const tradesData = JSON.parse(fileContent);
                    const trade = tradesData.find(t => t.id === orderId);
                    
                    if (trade && trade.status) {
                        if (trade.status === 'win') {
                            // Calculate profit based on percentage (70%, 100%, etc.)
                            const profitPercent = parseInt(trade.miaoshu) / 300 * 100; // Example calculation
                            profit = (parseFloat(trade.num) * (profitPercent / 100)).toFixed(2);
                        } else if (trade.status === 'loss') {
                            profit = -parseFloat(trade.num).toFixed(2);
                        }
                    }
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: 1, data: profit }));
            } catch (e) {
                console.error('[getorderjs] Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: 0, data: e.message }));
            }
        });
        return;
    }

    // Wallet API endpoints - connect / verify / me
    if (pathname === '/api/wallet/connect' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                const address = data.address;
                const chainId = data.chainId || 'ethereum';

                if (!address) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Missing wallet address' }));
                    return;
                }

                const result = connectWallet(address, chainId);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (e) {
                console.error('[wallet-connect] Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: e.message }));
            }
        });
        return;
    }

    if (pathname.match(/^\/api\/wallet\/verify/) && req.method === 'GET') {
        const queryParams = url.parse(req.url, true).query;
        const address = queryParams.address;
        if (!address) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Missing address parameter' }));
            return;
        }

        const result = verifyWallet(address);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
    }

    if (pathname.match(/^\/api\/wallet\/me/) && req.method === 'GET') {
        const queryParams = url.parse(req.url, true).query;
        const uid = queryParams.uid;
        if (!uid) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Missing uid parameter' }));
            return;
        }

        const user = getUserByUID(uid);
        const wallet = getWalletByUID(uid);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user, wallet }));
        return;
    }

    // Handle image upload for top-up proof
    if (pathname === '/api/upload-image' && req.method === 'POST') {
        let chunks = [];
        
        req.on('data', chunk => {
            chunks.push(chunk);
        });
        
        req.on('end', () => {
            try {
                const buffer = Buffer.concat(chunks);
                // Generate a simple filename based on timestamp and random
                const filename = 'proof_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '.png';
                const uploadPath = path.join(__dirname, 'uploads', filename);
                
                // Create uploads directory if it doesn't exist
                const uploadsDir = path.join(__dirname, 'uploads');
                if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }
                
                // Save file to disk
                fs.writeFileSync(uploadPath, buffer);
                
                // Return just the filename/path
                const fileUrl = '/uploads/' + filename;
                
                console.error('[upload] Saved file:', filename, 'Size:', buffer.length, 'bytes');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    code: 1, 
                    data: fileUrl,
                    message: 'Image uploaded successfully'
                }));
            } catch (e) {
                console.error('[upload] Error:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: 0, data: e.message }));
            }
        });
        return;
    }

    // Handle uploads directory - serve uploaded files
    if (pathname.startsWith('/uploads/')) {
        const filename = path.basename(pathname);
        const uploadPath = path.join(__dirname, 'uploads', filename);
        
        // Security: ensure the file is in the uploads directory
        if (!uploadPath.startsWith(path.join(__dirname, 'uploads'))) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
        }
        
        if (fs.existsSync(uploadPath)) {
            const data = fs.readFileSync(uploadPath);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(data);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
        }
        return;
    }

    // Handle Cloudflare RUM (Real User Monitoring) - suppress these requests locally
    if (pathname && pathname.startsWith('/cdn-cgi/')) {
        if (req.method === 'POST') {
            // Silently accept analytics data
            res.writeHead(204);
            res.end();
            return;
        }
    }

    // Default to index.html for root
    if (pathname === '/') {
        pathname = '/index.html';
    }

    // Handle requests for /js/ files - redirect to /Bvox_files/
    if (pathname.startsWith('/js/')) {
        const filename = pathname.split('/').pop();
        const alternatives = [
            path.join(__dirname, 'Bvox_files', filename + '.download'),
            path.join(__dirname, 'Bvox_files', filename),
            path.join(__dirname, 'js', filename),
            path.join(__dirname, filename)
        ];

        // Try to find the file from alternatives
        for (const alt of alternatives) {
            if (fs.existsSync(alt)) {
                pathname = alt.replace(__dirname, '');
                break;
            }
        }
    }

    // Build file path
    let filePath = path.join(__dirname, pathname);

    // Resolve potential directory traversal attacks
    filePath = path.normalize(filePath);
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden: Path traversal detected');
        return;
    }

    // Check if file exists
    fs.stat(filePath, (err, stats) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // Attempt alternate lookups before returning 404:
                // 1) If request is /img/..., look for that file inside any "*_files" directory
                // 2) If request is top-level like /kline.html, try to find that file inside any "*_files" directory
                try {
                    const tryFindInFilesDirs = () => {
                        const baseName = path.basename(pathname);
                        const relImgPath = pathname.replace(/^\/img\//, '');
                        const entries = fs.readdirSync(__dirname, { withFileTypes: true });
                        for (const e of entries) {
                            if (e.isDirectory() && e.name.endsWith('_files')) {
                                // 1) If the request was /img/..., try the relative path inside this _files dir
                                const candidate1 = path.join(__dirname, e.name, relImgPath);
                                if (fs.existsSync(candidate1)) return candidate1;

                                // 2) Try the basename inside the _files dir (e.g., /kline.html -> contract_files/kline.html)
                                const candidate2 = path.join(__dirname, e.name, baseName);
                                if (fs.existsSync(candidate2)) return candidate2;
                            }
                        }
                        // Also try a central 'img' folder if it exists
                        const centralImg = path.join(__dirname, 'img', pathname.replace(/^\/img\//, ''));
                        if (fs.existsSync(centralImg)) return centralImg;
                        return null;
                    };

                    const alt = tryFindInFilesDirs();
                    if (alt) {
                        const ext = path.extname(alt).toLowerCase();
                        const contentType = mimeTypes[ext] || 'application/octet-stream';
                        const data = fs.readFileSync(alt);
                        if (ext !== '.html') {
                            res.setHeader('Cache-Control', 'public, max-age=3600');
                        } else {
                            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                        }
                        res.writeHead(200, { 'Content-Type': contentType });
                        res.end(data);
                        return;
                    }
                } catch (e) {
                    // fall through to 404 render
                }

                // File not found (after alternate lookups)
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>404 - File Not Found</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 50px; }
                            h1 { color: #d32f2f; }
                            p { font-size: 16px; }
                        </style>
                    </head>
                    <body>
                        <h1>404 - File Not Found</h1>
                        <p>The requested file: <code>${pathname}</code> could not be found.</p>
                        <p>Search attempted in per-page <code>*_files</code> folders.</p>
                        <p><a href="/">Go back to home</a></p>
                    </body>
                    </html>
                `);
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Server Error: ${err.code}`);
            }
            return;
        }

        // Handle directories
        if (stats.isDirectory()) {
            // Try to serve index.html from the directory
            filePath = path.join(filePath, 'index.html');
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('404 - Not Found');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(data);
                }
            });
            return;
        }

        // Get file extension
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        // Read and serve the file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server Error');
                return;
            }

            // Add caching headers for static assets
            if (ext !== '.html') {
                res.setHeader('Cache-Control', 'public, max-age=3600');
            } else {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            }

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
    } catch (err) {
        console.error('Unhandled error in request:', err);
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error', message: err.message }));
        }
    }
});

// Start server
server.listen(PORT, HOST, () => {
    console.log(`
╔════════════════════════════════════════════╗
║     BVOX Finance Development Server        ║
╚════════════════════════════════════════════╝

🚀 Server running at: http://${HOST}:${PORT}
📁 Root directory: ${__dirname}

Available features:
  ✓ Static file serving
  ✓ CORS enabled
  ✓ Hot reload compatible
  ✓ Development debugging

Open your browser at: http://${HOST}:${PORT}

Press Ctrl+C to stop the server
    `);
});

// Handle server errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`✗ Port ${PORT} is already in use.`);
        console.log(`Try: node server.js --port ${PORT + 1}`);
    } else {
        console.error(`✗ Server error: ${err.message}`);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n⚠ SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('✓ HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n⚠ SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('✓ HTTP server closed');
        process.exit(0);
    });
});
