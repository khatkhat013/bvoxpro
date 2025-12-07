/**
 * Wallet Model - Data Persistence Layer (JSON)
 */

const JSONStore = require('./jsonStore');

class WalletModel {
  static store = new JSONStore('wallets.json');

  static findAll() {
    return this.store.findAll();
  }

  static findById(walletId) {
    return this.store.findOne({ walletId });
  }

  static findByAddress(address) {
    return this.store.findOne({ address: address.toLowerCase() });
  }

  static findByUserId(userid) {
    return this.store.find({ userid });
  }

  static save(wallet) {
    const existing = this.findById(wallet.walletId);
    if (existing) {
      return this.store.updateOne({ walletId: wallet.walletId }, wallet);
    }
    return this.store.insertOne(wallet);
  }

  static delete(walletId) {
    return this.store.deleteOne({ walletId });
  }

  static count() {
    return this.store.count();
  }
}

module.exports = WalletModel;
