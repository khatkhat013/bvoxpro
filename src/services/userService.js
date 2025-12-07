/**
 * User Service - Business Logic
 * Handles user profile, KYC, and account management.
 * NO file I/O, NO HTTP - purely business logic.
 */

const UserModel = require('../models/userModel');
const WalletModel = require('../models/walletModel');

class UserService {
  /**
   * Get user profile by ID
   */
  static async getUserProfile(userid) {
    const user = await UserModel.findById(userid);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userid, updates) {
    const user = await UserModel.findById(userid);
    if (!user) {
      throw new Error('User not found');
    }

    // Only allow specific fields to be updated
    const allowedFields = ['email', 'phoneNumber', 'firstName', 'lastName', 'kycStatus', 'kycData'];
    const safeUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        safeUpdates[field] = updates[field];
      }
    }

    const updated = { ...user, ...safeUpdates, lastUpdated: Date.now() };
    await UserModel.save(updated);
    return updated;
  }

  /**
   * Get all users (admin only - no validation here, done in controller)
   */
  static async getAllUsers() {
    return await UserModel.findAll();
  }

  /**
   * Get user count
   */
  static async getUserCount() {
    return await UserModel.count();
  }

  /**
   * Search users by criteria
   */
  static async searchUsers(query) {
    const allUsers = await UserModel.findAll();
    return allUsers.filter(user => {
      return Object.keys(query).every(key => {
        const queryVal = String(query[key]).toLowerCase();
        const userVal = String(user[key] || '').toLowerCase();
        return userVal.includes(queryVal);
      });
    });
  }

  /**
   * Get user by address
   */
  static async getUserByAddress(address) {
    return await UserModel.findByAddress(address);
  }

  /**
   * Ban/suspend user
   */
  static async banUser(userid) {
    const user = await UserModel.findById(userid);
    if (!user) {
      throw new Error('User not found');
    }
    user.banned = true;
    user.bannedAt = Date.now();
    await UserModel.save(user);
    return user;
  }

  /**
   * Unban user
   */
  static async unbanUser(userid) {
    const user = await UserModel.findById(userid);
    if (!user) {
      throw new Error('User not found');
    }
    user.banned = false;
    user.bannedAt = null;
    await UserModel.save(user);
    return user;
  }
}

module.exports = UserService;
