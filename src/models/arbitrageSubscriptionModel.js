/**
 * Arbitrage Subscription Model - Data Persistence
 * Manages arbitrage subscription records using JSONStore.
 */

const JSONStore = require('./jsonStore');

const DATA_FILE = 'arbitrage_subscriptions.json';

class ArbitrageSubscriptionModel {
  /**
   * Find all subscriptions
   */
  static async findAll() {
    const store = new JSONStore(DATA_FILE);
    return await store.find({});
  }

  /**
   * Find by ID
   */
  static async findById(id) {
    const store = new JSONStore(DATA_FILE);
    return await store.findOne({ id });
  }

  /**
   * Find subscriptions by user ID
   */
  static async findByUserId(userid) {
    const store = new JSONStore(DATA_FILE);
    return await store.find({ userid });
  }

  /**
   * Find active subscriptions
   */
  static async findActive() {
    const store = new JSONStore(DATA_FILE);
    return await store.find({ status: 'active', settled: false });
  }

  /**
   * Find subscriptions due for settlement
   */
  static async findDueForSettlement() {
    const now = Date.now();
    const store = new JSONStore(DATA_FILE);
    const all = await this.findActive();
    return all.filter(sub => sub.maturityDate <= now);
  }

  /**
   * Save subscription
   */
  static async save(subscription) {
    const store = new JSONStore(DATA_FILE);
    const existing = await store.findOne({ id: subscription.id });

    if (existing) {
      await store.updateOne({ id: subscription.id }, subscription);
    } else {
      await store.insertOne(subscription);
    }

    return subscription;
  }

  /**
   * Delete subscription
   */
  static async delete(id) {
    const store = new JSONStore(DATA_FILE);
    await store.deleteOne({ id });
  }

  /**
   * Count subscriptions
   */
  static async count(query = {}) {
    const store = new JSONStore(DATA_FILE);
    return await store.count(query);
  }

  /**
   * Get user's total arbitrage investment
   */
  static async getUserTotalInvestment(userid) {
    const subscriptions = await this.findByUserId(userid);
    return subscriptions.reduce((sum, s) => sum + s.amount, 0);
  }

  /**
   * Get winning subscriptions
   */
  static async getWinningSubscriptions() {
    const store = new JSONStore(DATA_FILE);
    return await store.find({ settled: true, won: true });
  }

  /**
   * Get losing subscriptions
   */
  static async getLosingSubscriptions() {
    const store = new JSONStore(DATA_FILE);
    return await store.find({ settled: true, won: false });
  }
}

module.exports = ArbitrageSubscriptionModel;
