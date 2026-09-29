/**
 * Cache Plugin
 * In-memory caching with TTL support
 */

class CachePlugin {
  constructor(config = {}) {
    this.name = config.name || 'CachePlugin';
    this.version = config.version || '1.0.0';
    this.enabled = config.enabled !== false;
    this.cache = new Map();
    this.ttls = new Map();
  }

  init() {
    if (!this.enabled) {
      console.log(`${this.name} is disabled`);
      return false;
    }
    console.log(`${this.name} v${this.version} initialized`);
    this.startCleanup();
    return true;
  }

  /**
   * Set a cache entry
   * @param {string} key - Cache key
   * @param {any} value - Cache value
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, value, ttl = null) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    this.cache.set(key, value);

    if (ttl) {
      const expiresAt = Date.now() + ttl;
      this.ttls.set(key, expiresAt);
    }

    return { status: 'success', key, cached: true };
  }

  /**
   * Get a cache entry
   * @param {string} key - Cache key
   */
  get(key) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    // Check if expired
    if (this.ttls.has(key)) {
      const expiresAt = this.ttls.get(key);
      if (Date.now() > expiresAt) {
        this.delete(key);
        return null;
      }
    }

    return this.cache.get(key) || null;
  }

  /**
   * Delete a cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    this.ttls.delete(key);
    return { status: 'success', deleted: true };
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.ttls.clear();
    return { status: 'success', cleared: true };
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }

  /**
   * Check if key exists
   */
  has(key) {
    if (this.ttls.has(key)) {
      const expiresAt = this.ttls.get(key);
      if (Date.now() > expiresAt) {
        this.delete(key);
        return false;
      }
    }
    return this.cache.has(key);
  }

  /**
   * Start cleanup timer
   */
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, expiresAt] of this.ttls) {
        if (now > expiresAt) {
          this.delete(key);
        }
      }
    }, 1000);
  }

  /**
   * Execute plugin logic
   */
  execute(input) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    const { action, key, value, ttl } = input;

    switch (action) {
      case 'set':
        return this.set(key, value, ttl);
      case 'get':
        return this.get(key);
      case 'delete':
        return this.delete(key);
      case 'clear':
        return this.clear();
      case 'size':
        return this.size();
      case 'has':
        return this.has(key);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    console.log(`${this.name} shutdown (${this.cache.size} entries cleared)`);
    return true;
  }
}

module.exports = CachePlugin;
