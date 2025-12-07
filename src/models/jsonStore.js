/**
 * JSON Data Store - Pure data persistence layer
 * Only handles file I/O. No business logic.
 * Can be easily swapped with MongoDB in future.
 */

const fs = require('fs');
const path = require('path');

class JSONStore {
  constructor(filename) {
    this.filepath = path.join(__dirname, '../../', filename);
    this.data = this.read();
  }

  read() {
    try {
      if (!fs.existsSync(this.filepath)) {
        return [];
      }
      const data = fs.readFileSync(this.filepath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (e) {
      console.error(`[JSONStore] Error reading ${this.filepath}:`, e.message);
      return [];
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filepath, JSON.stringify(data, null, 2));
      this.data = data;
      return true;
    } catch (e) {
      console.error(`[JSONStore] Error writing ${this.filepath}:`, e.message);
      return false;
    }
  }

  // Query Methods (these match MongoDB-like patterns for easy future migration)
  findAll() {
    return [...this.data];
  }

  findOne(query) {
    for (const item of this.data) {
      if (this.matchesQuery(item, query)) {
        return item;
      }
    }
    return null;
  }

  find(query) {
    return this.data.filter(item => this.matchesQuery(item, query));
  }

  insertOne(doc) {
    this.data.push(doc);
    this.write(this.data);
    return doc;
  }

  insert(docs) {
    this.data.push(...docs);
    this.write(this.data);
    return docs;
  }

  updateOne(query, update) {
    const index = this.data.findIndex(item => this.matchesQuery(item, query));
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...update };
      this.write(this.data);
      return this.data[index];
    }
    return null;
  }

  updateMany(query, update) {
    let count = 0;
    this.data = this.data.map(item => {
      if (this.matchesQuery(item, query)) {
        count++;
        return { ...item, ...update };
      }
      return item;
    });
    if (count > 0) {
      this.write(this.data);
    }
    return count;
  }

  deleteOne(query) {
    const index = this.data.findIndex(item => this.matchesQuery(item, query));
    if (index !== -1) {
      const deleted = this.data.splice(index, 1)[0];
      this.write(this.data);
      return deleted;
    }
    return null;
  }

  deleteMany(query) {
    const beforeLength = this.data.length;
    this.data = this.data.filter(item => !this.matchesQuery(item, query));
    const deletedCount = beforeLength - this.data.length;
    if (deletedCount > 0) {
      this.write(this.data);
    }
    return deletedCount;
  }

  // Helper: match simple query object
  matchesQuery(item, query) {
    for (const key in query) {
      if (item[key] !== query[key]) {
        return false;
      }
    }
    return true;
  }

  // Utility: get count
  count(query = {}) {
    if (Object.keys(query).length === 0) {
      return this.data.length;
    }
    return this.find(query).length;
  }

  // Utility: clear all
  clear() {
    this.data = [];
    this.write(this.data);
  }
}

module.exports = JSONStore;
