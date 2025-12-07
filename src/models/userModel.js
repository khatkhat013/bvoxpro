/**
 * User Model - Data Persistence Layer (JSON)
 * Only handles data I/O. No business logic.
 */

const JSONStore = require('./jsonStore');

class UserModel {
  static store = new JSONStore('users.json');

  static findAll() {
    return this.store.findAll();
  }

  static findById(userid) {
    return this.store.findOne({ userid });
  }

  static findByAddress(address) {
    return this.store.findOne({ address: address.toLowerCase() });
  }

  static save(user) {
    const existing = this.findById(user.userid);
    if (existing) {
      return this.store.updateOne({ userid: user.userid }, user);
    }
    return this.store.insertOne(user);
  }

  static delete(userid) {
    return this.store.deleteOne({ userid });
  }

  static count() {
    return this.store.count();
  }
}

module.exports = UserModel;
