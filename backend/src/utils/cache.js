class Cache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttl = 3600000) {
    this.store.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  has(key) {
    return this.get(key) !== null;
  }
}

export const cache = new Cache();
