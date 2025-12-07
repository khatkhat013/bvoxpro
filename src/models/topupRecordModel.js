/**
 * Topup Record Model - Data Persistence
 * Manages topup transaction records using JSONStore.
 */

const JSONStore = require('./jsonStore');

const DATA_FILE = 'topup_records.json';

class TopupRecordModel {
  /**
   * Find all records
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
   * Find records by user ID
   */
  static async findByUserId(userid) {
    const store = new JSONStore(DATA_FILE);
    return await store.find({ userid });
  }

  /**
   * Find records by status
   */
  static async findByStatus(status) {
    const store = new JSONStore(DATA_FILE);
    return await store.find({ status });
  }

  /**
   * Find completed records
   */
  static async findCompleted() {
    return this.findByStatus('completed');
  }

  /**
   * Find pending records
   */
  static async findPending() {
    return this.findByStatus('pending');
  }

  /**
   * Save record
   */
  static async save(record) {
    const store = new JSONStore(DATA_FILE);
    const existing = await store.findOne({ id: record.id });

    if (existing) {
      await store.updateOne({ id: record.id }, record);
    } else {
      await store.insertOne(record);
    }

    return record;
  }

  /**
   * Delete record
   */
  static async delete(id) {
    const store = new JSONStore(DATA_FILE);
    await store.deleteOne({ id });
  }

  /**
   * Count records
   */
  static async count(query = {}) {
    const store = new JSONStore(DATA_FILE);
    return await store.count(query);
  }

  /**
   * Get user's total topup amount
   */
  static async getUserTotalTopup(userid) {
    const records = await this.findByUserId(userid);
    return records
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.amount, 0);
  }

  /**
   * Get total topups by coin
   */
  static async getTotalTopupByCoin(coin) {
    const records = await this.findCompleted();
    return records
      .filter(r => r.coin === coin)
      .reduce((sum, r) => sum + r.amount, 0);
  }
}

module.exports = TopupRecordModel;
