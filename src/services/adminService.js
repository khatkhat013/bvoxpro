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
}

module.exports = AdminService;
