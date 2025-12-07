/**
 * Admin Service - thin wrapper around legacy adminModel functions
 */

const adminModel = require('../../admin/adminModel');

class AdminService {
  static async getAllUsers() {
    return adminModel.getAllUsers();
  }

  static async getUserById(userId) {
    return adminModel.getUserById(userId);
  }

  static async updateUserBalance(userId, coin, amount) {
    return adminModel.updateUserBalance(userId, coin, amount);
  }

  static async getUserStats(userId) {
    return adminModel.getUserStats(userId);
  }

  static async addTopupRecord(userId, coin, amount) {
    return adminModel.addTopupRecord(userId, coin, amount);
  }

  static async addWithdrawalRecord(userId, coin, address, quantity) {
    return adminModel.addWithdrawalRecord(userId, coin, address, quantity);
  }

  static async deleteTransaction(type, id) {
    return adminModel.deleteTransaction(type, id);
  }

  static async setUserFlag(userId, flagKey, flagValue) {
    return adminModel.setUserFlag(userId, flagKey, flagValue);
  }

  // Approve a topup record by id: mark complete, update user balance, add notification
  static async approveTopup(id) {
    const fs = require('fs');
    const path = require('path');
    const topupPath = path.resolve(process.cwd(), 'topup_records.json');
    try {
      let topups = [];
      if (fs.existsSync(topupPath)) {
        topups = JSON.parse(fs.readFileSync(topupPath, 'utf8')) || [];
      }
      const idx = topups.findIndex(r => String(r.id) === String(id));
      if (idx === -1) throw new Error('Topup record not found');
      const record = topups[idx];
      if (record.status && record.status !== 'pending') throw new Error('Record is not pending');

      record.status = 'complete';
      record.updated_at = new Date().toISOString();
      topups[idx] = record;
      fs.writeFileSync(topupPath, JSON.stringify(topups, null, 2));

      // update user balance (best-effort)
      try {
        const usersPath = path.resolve(process.cwd(), 'users.json');
        let users = [];
        if (fs.existsSync(usersPath)) {
          users = JSON.parse(fs.readFileSync(usersPath, 'utf8')) || [];
        }
        const userIdx = users.findIndex(u => String(u.userid) === String(record.user_id) || String(u.uid) === String(record.user_id));
        if (userIdx !== -1) {
          const user = users[userIdx];
          const coin = (record.coin || 'usdt').toLowerCase();
          const amount = parseFloat(record.amount) || 0;
          if (!user.balances) user.balances = {};
          user.balances[coin] = (user.balances[coin] || 0) + amount;
          fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
        }
      } catch (e) { /* best-effort only */ }

      // add notification (best-effort)
      try {
        const notiPath = path.resolve(process.cwd(), 'notifications.json');
        let notis = [];
        if (fs.existsSync(notiPath)) notis = JSON.parse(fs.readFileSync(notiPath, 'utf8')) || [];
        const { v4: uuidv4 } = require('uuid');
        const item = { id: uuidv4(), userid: record.user_id, biaoti: 'Topup Approved', neirong: `Your deposit of ${record.amount} ${record.coin || 'USDT'} has been approved.`, shijian: Math.floor(Date.now()/1000), sfyidu: 0 };
        notis.push(item);
        fs.writeFileSync(notiPath, JSON.stringify(notis, null, 2));
      } catch (e) { /* ignore */ }

      return record;
    } catch (err) {
      throw err;
    }
  }

  static async rejectTopup(id, reason) {
    const fs = require('fs');
    const path = require('path');
    const topupPath = path.resolve(process.cwd(), 'topup_records.json');
    try {
      let topups = [];
      if (fs.existsSync(topupPath)) {
        topups = JSON.parse(fs.readFileSync(topupPath, 'utf8')) || [];
      }
      const idx = topups.findIndex(r => String(r.id) === String(id));
      if (idx === -1) throw new Error('Topup record not found');
      const record = topups[idx];
      if (record.status && record.status !== 'pending') throw new Error('Record is not pending');

      record.status = 'rejected';
      record.rejection_reason = reason || 'No reason provided';
      record.updated_at = new Date().toISOString();
      topups[idx] = record;
      fs.writeFileSync(topupPath, JSON.stringify(topups, null, 2));

      // notify
      try {
        const notiPath = path.resolve(process.cwd(), 'notifications.json');
        let notis = [];
        if (fs.existsSync(notiPath)) notis = JSON.parse(fs.readFileSync(notiPath, 'utf8')) || [];
        const { v4: uuidv4 } = require('uuid');
        const item = { id: uuidv4(), userid: record.user_id, biaoti: 'Topup Rejected', neirong: `Your deposit request ${record.id} was rejected.`, shijian: Math.floor(Date.now()/1000), sfyidu: 0 };
        notis.push(item);
        fs.writeFileSync(notiPath, JSON.stringify(notis, null, 2));
      } catch (e) {}

      return record;
    } catch (err) {
      throw err;
    }
  }

  static async completeWithdrawal(id, txHash) {
    const fs = require('fs');
    const path = require('path');
    const withdrawalPath = path.resolve(process.cwd(), 'withdrawals_records.json');
    try {
      let records = [];
      if (fs.existsSync(withdrawalPath)) records = JSON.parse(fs.readFileSync(withdrawalPath, 'utf8')) || [];
      const idx = records.findIndex(r => String(r.id) === String(id));
      if (idx === -1) throw new Error('Withdrawal record not found');
      const record = records[idx];
      if (record.status && record.status !== 'pending') throw new Error('Record is not pending');

      record.status = 'completed';
      if (txHash) record.txHash = txHash;
      record.updated_at = new Date().toISOString();
      records[idx] = record;
      fs.writeFileSync(withdrawalPath, JSON.stringify(records, null, 2));

      // update user balance (best-effort)
      try {
        const usersPath = path.resolve(process.cwd(), 'users.json');
        let users = [];
        if (fs.existsSync(usersPath)) users = JSON.parse(fs.readFileSync(usersPath, 'utf8')) || [];
        const userIdx = users.findIndex(u => String(u.userid) === String(record.user_id) || String(u.uid) === String(record.user_id));
        if (userIdx !== -1) {
          const user = users[userIdx];
          const coin = (record.coin || 'btc').toLowerCase();
          const quantity = parseFloat(record.quantity) || 0;
          if (!user.balances) user.balances = {};
          user.balances[coin] = Math.max(0, (user.balances[coin] || 0) - quantity);
          fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
        }
      } catch (e) {}

      // notify
      try {
        const notiPath = path.resolve(process.cwd(), 'notifications.json');
        let notis = [];
        if (fs.existsSync(notiPath)) notis = JSON.parse(fs.readFileSync(notiPath, 'utf8')) || [];
        const { v4: uuidv4 } = require('uuid');
        const item = { id: uuidv4(), userid: record.user_id, biaoti: 'Withdrawal Completed', neirong: `Your withdrawal of ${record.quantity} ${record.coin || ''} has been completed.`, shijian: Math.floor(Date.now()/1000), sfyidu: 0 };
        notis.push(item);
        fs.writeFileSync(notiPath, JSON.stringify(notis, null, 2));
      } catch (e) {}

      return record;
    } catch (err) {
      throw err;
    }
  }

  static async rejectWithdrawal(id, reason) {
    const fs = require('fs');
    const path = require('path');
    const withdrawalPath = path.resolve(process.cwd(), 'withdrawals_records.json');
    try {
      let records = [];
      if (fs.existsSync(withdrawalPath)) records = JSON.parse(fs.readFileSync(withdrawalPath, 'utf8')) || [];
      const idx = records.findIndex(r => String(r.id) === String(id));
      if (idx === -1) throw new Error('Withdrawal record not found');
      const record = records[idx];
      if (record.status && record.status !== 'pending') throw new Error('Record is not pending');

      record.status = 'rejected';
      record.rejection_reason = reason || 'No reason provided';
      record.updated_at = new Date().toISOString();
      records[idx] = record;
      fs.writeFileSync(withdrawalPath, JSON.stringify(records, null, 2));

      // notify
      try {
        const notiPath = path.resolve(process.cwd(), 'notifications.json');
        let notis = [];
        if (fs.existsSync(notiPath)) notis = JSON.parse(fs.readFileSync(notiPath, 'utf8')) || [];
        const { v4: uuidv4 } = require('uuid');
        const item = { id: uuidv4(), userid: record.user_id, biaoti: 'Withdrawal Rejected', neirong: `Your withdrawal request ${record.id} was rejected.`, shijian: Math.floor(Date.now()/1000), sfyidu: 0 };
        notis.push(item);
        fs.writeFileSync(notiPath, JSON.stringify(notis, null, 2));
      } catch (e) {}

      return record;
    } catch (err) {
      throw err;
    }
  }

  static async approveKyc(id, reviewer) {
    const fs = require('fs');
    const path = require('path');
    const kycPath = path.resolve(process.cwd(), 'kyc_records.json');
    try {
      let kyc = [];
      if (fs.existsSync(kycPath)) kyc = JSON.parse(fs.readFileSync(kycPath, 'utf8')) || [];
      const idx = kyc.findIndex(r => String(r.id) === String(id));
      if (idx === -1) throw new Error('KYC record not found');
      kyc[idx].status = 'approved';
      kyc[idx].reviewed_at = new Date().toISOString();
      kyc[idx].reviewed_by = reviewer || 'admin';
      fs.writeFileSync(kycPath, JSON.stringify(kyc, null, 2));

      // update users.json
      try {
        const usersPath = path.resolve(process.cwd(), 'users.json');
        let users = [];
        if (fs.existsSync(usersPath)) users = JSON.parse(fs.readFileSync(usersPath, 'utf8')) || [];
        const targetUserId = kyc[idx].userid;
        const userIdx = users.findIndex(u => String(u.userid) === String(targetUserId) || String(u.uid) === String(targetUserId));
        if (userIdx !== -1) {
          if (!users[userIdx].kycStatus) users[userIdx].kycStatus = 'none';
          if (kyc[idx].stage == 1) users[userIdx].kycStatus = 'basic';
          if (kyc[idx].stage == 2) users[userIdx].kycStatus = 'advanced';
          users[userIdx].verified = true;
          fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
        }
      } catch (e) {}

      // notify
      try {
        const notiPath = path.resolve(process.cwd(), 'notifications.json');
        let notis = [];
        if (fs.existsSync(notiPath)) notis = JSON.parse(fs.readFileSync(notiPath, 'utf8')) || [];
        const { v4: uuidv4 } = require('uuid');
        const item = { id: uuidv4(), userid: kyc[idx].userid, biaoti: 'KYC Approved', neirong: `Your KYC (stage ${kyc[idx].stage}) has been approved.`, shijian: Math.floor(Date.now()/1000), sfyidu: 0 };
        notis.push(item);
        fs.writeFileSync(notiPath, JSON.stringify(notis, null, 2));
      } catch (e) {}

      return kyc[idx];
    } catch (err) {
      throw err;
    }
  }

  static async rejectKyc(id, reviewer, reason) {
    const fs = require('fs');
    const path = require('path');
    const kycPath = path.resolve(process.cwd(), 'kyc_records.json');
    try {
      let kyc = [];
      if (fs.existsSync(kycPath)) kyc = JSON.parse(fs.readFileSync(kycPath, 'utf8')) || [];
      const idx = kyc.findIndex(r => String(r.id) === String(id));
      if (idx === -1) throw new Error('KYC record not found');
      kyc[idx].status = 'rejected';
      kyc[idx].reviewed_at = new Date().toISOString();
      kyc[idx].reviewed_by = reviewer || 'admin';
      kyc[idx].reject_reason = reason || null;
      fs.writeFileSync(kycPath, JSON.stringify(kyc, null, 2));

      // update users.json to reflect rejection
      try {
        const usersPath = path.resolve(process.cwd(), 'users.json');
        let users = [];
        if (fs.existsSync(usersPath)) users = JSON.parse(fs.readFileSync(usersPath, 'utf8')) || [];
        const targetUserId = kyc[idx].userid;
        const userIdx = users.findIndex(u => String(u.userid) === String(targetUserId) || String(u.uid) === String(targetUserId));
        if (userIdx !== -1) {
          users[userIdx].kycStatus = 'none';
          users[userIdx].verified = false;
          fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
        }
      } catch (e) {}

      // notify
      try {
        const notiPath = path.resolve(process.cwd(), 'notifications.json');
        let notis = [];
        if (fs.existsSync(notiPath)) notis = JSON.parse(fs.readFileSync(notiPath, 'utf8')) || [];
        const { v4: uuidv4 } = require('uuid');
        const reasonText = kyc[idx].reject_reason || '';
        const item = { id: uuidv4(), userid: kyc[idx].userid, biaoti: 'KYC Rejected', neirong: `Your KYC was rejected. ${reasonText}`, shijian: Math.floor(Date.now()/1000), sfyidu: 0 };
        notis.push(item);
        fs.writeFileSync(notiPath, JSON.stringify(notis, null, 2));
      } catch (e) {}

      return kyc[idx];
    } catch (err) {
      throw err;
    }
  }
}

module.exports = AdminService;
