// walletModel.js
const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'users.json');
const WALLETS_FILE = path.join(__dirname, 'wallets.json');

function loadJson(filePath) {
    if (!fs.existsSync(filePath)) return [];
    try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (e) { return []; }
}

function saveJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function generateNextUserId() {
    const users = loadJson(USERS_FILE);
    const base = 342016;
    if (users.length === 0) return String(base);
    // Find numeric userids and get max
    const nums = users.map(u => parseInt(u.userid, 10)).filter(n => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : base;
    return String(Math.max(base, max + 1));
}

function getUserByUID(uid) {
    const users = loadJson(USERS_FILE);
    return users.find(u => String(u.userid) === String(uid)) || null;
}

function getWalletByUID(uid) {
    const wallets = loadJson(WALLETS_FILE);
    return wallets.find(w => String(w.uid) === String(uid)) || null;
}

function getWalletByAddress(address) {
    if (!address) return null;
    const a = address.toLowerCase();
    const wallets = loadJson(WALLETS_FILE);
    return wallets.find(w => (w.address || '').toLowerCase() === a) || null;
}

function connectWallet(address, chainId = '') {
    if (!address) throw new Error('Missing address');
    const normalized = address.toLowerCase();

    let wallets = loadJson(WALLETS_FILE);
    let users = loadJson(USERS_FILE);

    // Return existing wallet if present
    let wallet = wallets.find(w => (w.address || '').toLowerCase() === normalized);
    if (wallet) {
        const user = users.find(u => String(u.userid) === String(wallet.uid)) || null;
        return { success: true, wallet, user };
    }

    // Create new UID and wallet
    const uid = generateNextUserId();
    wallet = {
        uid: String(uid),
        address: address,
        chainId: chainId || '',
        created_at: new Date().toISOString(),
        timestamp: Date.now()
    };
    wallets.push(wallet);
    saveJson(WALLETS_FILE, wallets);

    // Create user record if not exists (simple user object)
    let user = users.find(u => (u.address || '').toLowerCase() === normalized);
    if (!user) {
        user = {
            userid: String(uid),
            address: address,
            balances: { usdt: 0, btc: 0, eth: 0, usdc: 0, pyusd: 0, sol: 0 },
            kycStatus: 'pending',
            created_at: new Date().toISOString(),
            timestamp: Date.now()
        };
        users.push(user);
        saveJson(USERS_FILE, users);
    }

    return { success: true, wallet, user };
}

function verifyWallet(address) {
    if (!address) return { success: false, message: 'Missing address' };
    const wallet = getWalletByAddress(address);
    return { success: true, exists: !!wallet, wallet: wallet || null };
}

module.exports = {
    connectWallet,
    verifyWallet,
    getWalletByUID,
    getUserByUID,
    getWalletByAddress,
    generateNextUserId
};
