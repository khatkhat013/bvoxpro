/**
 * Mining Record Model - Data Persistence
 * Manages mining subscription records using JSONStore.
 */

const JSONStore = require('./jsonStore');

const DATA_FILE = 'mining_records.json';

class MiningRecordModel {
  /**
   * Find all mining records
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
   * Find active records
   */
  static async findActive() {
    const store = new JSONStore(DATA_FILE);
    return await store.find({ status: 'active', settled: false });
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
   * Get user's total mining amount
   */
  static async getUserTotalMiningAmount(userid) {
    const records = await this.findByUserId(userid);
    return records.reduce((sum, r) => sum + r.amount, 0);
  }

  /**
   * Get records due for settlement
   */
  static async getRecordsDueForSettlement() {
    const now = Date.now();
    const store = new JSONStore(DATA_FILE);
    return await store.find({ 
      status: 'active', 
      settled: false,
      maturityDate: { $lte: now }
    });
  }
}

module.exports = MiningRecordModel;
