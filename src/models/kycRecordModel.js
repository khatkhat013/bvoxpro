/**
 * KYC Record Model - Data Persistence
 * Manages KYC verification records using JSONStore.
 */

const JSONStore = require('./jsonStore');

const DATA_FILE = 'kyc_records.json';

class KYCRecordModel {
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
   * Find pending records (admin review)
   */
  static async findPending() {
    return this.findByStatus('submitted');
  }

  /**
   * Find verified records
   */
  static async findVerified() {
    return this.findByStatus('verified');
  }

  /**
   * Find rejected records
   */
  static async findRejected() {
    return this.findByStatus('rejected');
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
   * Get latest KYC record for user
   */
  static async getLatestForUser(userid) {
    const records = await this.findByUserId(userid);
    if (records.length === 0) return null;
    
    // Sort by submittedAt descending, return first
    return records.sort((a, b) => b.submittedAt - a.submittedAt)[0];
  }

  /**
   * Get user's KYC tier progress
   */
  static async getUserKYCProgress(userid) {
    const records = await this.findByUserId(userid);
    const verifiedTiers = new Set();

    records
      .filter(r => r.status === 'verified')
      .forEach(r => verifiedTiers.add(r.tier));

    return {
      userid,
      highestVerifiedTier: verifiedTiers.size > 0 ? Math.max(...verifiedTiers) : 0,
      verifiedTiers: Array.from(verifiedTiers).sort()
    };
  }
}

module.exports = KYCRecordModel;
