// withdrawalRecordModel.js
const fs = require('fs');
const path = require('path');

const WITHDRAWAL_RECORDS_FILE = path.join(__dirname, 'withdrawals_records.json');

function loadRecords() {
    if (!fs.existsSync(WITHDRAWAL_RECORDS_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(WITHDRAWAL_RECORDS_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

function saveRecords(records) {
    fs.writeFileSync(WITHDRAWAL_RECORDS_FILE, JSON.stringify(records, null, 2));
}

function saveWithdrawalRecord({ user_id, coin, address, quantity, status = 'pending' }) {
    if (!user_id || !coin || !address || !quantity) {
        throw new Error('Missing required fields: user_id, coin, address, quantity');
    }

    const records = loadRecords();
    const record = {
        id: `withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id,
        coin: coin.toUpperCase(),
        address,
        quantity: parseFloat(quantity),
        status, // pending, approved, rejected
        timestamp: Date.now(),
        created_at: new Date().toISOString()
    };

    records.push(record);
    saveRecords(records);
    return record;
}

function getUserWithdrawalRecords(user_id) {
    const records = loadRecords();
    return records.filter(r => r.user_id === user_id).sort((a, b) => b.timestamp - a.timestamp);
}

function getAllWithdrawalRecords() {
    return loadRecords().sort((a, b) => b.timestamp - a.timestamp);
}

function updateRecordStatus(record_id, new_status) {
    const records = loadRecords();
    const idx = records.findIndex(r => r.id === record_id);
    if (idx === -1) return null;

    records[idx].status = new_status;
    records[idx].updated_at = new Date().toISOString();
    saveRecords(records);
    return records[idx];
}

module.exports = {
    saveWithdrawalRecord,
    getUserWithdrawalRecords,
    getAllWithdrawalRecords,
    updateRecordStatus
};
