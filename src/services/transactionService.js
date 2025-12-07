/**
 * Transaction Service - Business Logic
 * Handles topup, withdrawal, and transaction records.
 * NO file I/O, NO HTTP - purely business logic.
 */

const UserModel = require('../models/userModel');

class TransactionService {
  /**
   * Process topup (add funds)
   */
  static async processTopup(userid, amount, coin, paymentMethod = 'card') {
    const user = await UserModel.findById(userid);
    if (!user) {
      throw new Error('User not found');
    }

    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const transaction = {
      id: `topup_${userid}_${Date.now()}`,
      userid,
      amount,
      coin,
      paymentMethod,
      type: 'topup',
      status: 'pending', // pending -> completed or failed
      initiatedAt: Date.now(),
      completedAt: null,
      description: `Topup ${amount} ${coin.toUpperCase()}`
    };

    return transaction;
  }

  /**
   * Process withdrawal (remove funds)
   */
  static async processWithdrawal(userid, amount, coin, withdrawalAddress) {
    const user = await UserModel.findById(userid);
    if (!user) {
      throw new Error('User not found');
    }

    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Validate balance
    const currentBalance = user.balances?.[coin] || 0;
    if (currentBalance < amount) {
      throw new Error(`Insufficient ${coin.toUpperCase()} balance. Required: ${amount}, Available: ${currentBalance}`);
    }

    // Validate address format
    if (!withdrawalAddress || withdrawalAddress.length < 5) {
      throw new Error('Invalid withdrawal address');
    }

    const transaction = {
      id: `withdrawal_${userid}_${Date.now()}`,
      userid,
      amount,
      coin,
      withdrawalAddress,
      type: 'withdrawal',
      status: 'pending', // pending -> completed or failed
      initiatedAt: Date.now(),
      completedAt: null,
      txHash: null,
      description: `Withdrawal ${amount} ${coin.toUpperCase()}`
    };

    return transaction;
  }

  /**
   * Complete transaction (topup/withdrawal)
   */
  static async completeTransaction(transaction, txHash = null) {
    const completed = {
      ...transaction,
      status: 'completed',
      completedAt: Date.now(),
      txHash: txHash || transaction.txHash
    };

    return completed;
  }

  /**
   * Fail transaction
   */
  static async failTransaction(transaction, reason) {
    const failed = {
      ...transaction,
      status: 'failed',
      failureReason: reason,
      failedAt: Date.now()
    };

    return failed;
  }

  /**
   * Get transaction history for user
   */
  static async getTransactionHistory(userid, limit = 50) {
    // Reads from topup/withdrawal records models
    // Placeholder: return empty array
    return [];
  }

  /**
   * Calculate transaction fee
   */
  static calculateFee(amount, coin, type = 'withdrawal') {
    // Fee structure: percentage-based
    const feePercentage = {
      'topup': 0.00, // 0% topup fee
      'withdrawal': type === 'withdrawal' ? 0.01 : 0.00 // 1% withdrawal fee
    };

    const feeRate = feePercentage[type] || 0;
    return amount * feeRate;
  }
}

module.exports = TransactionService;
