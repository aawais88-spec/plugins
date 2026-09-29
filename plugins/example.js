/**
 * Example Plugin
 * A basic plugin template for development
 */

class ExamplePlugin {
  constructor(config = {}) {
    this.name = config.name || 'ExamplePlugin';
    this.version = config.version || '1.0.0';
    this.enabled = config.enabled !== false;
  }

  /**
   * Initialize the plugin
   */
  init() {
    if (!this.enabled) {
      console.log(`${this.name} is disabled`);
      return false;
    }
    console.log(`${this.name} v${this.version} initialized`);
    return true;
  }

  /**
   * Execute plugin logic
   * @param {Object} input - Input data
   * @returns {Object} Result
   */
  execute(input) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    return {
      status: 'success',
      data: input,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cleanup when shutting down
   */
  shutdown() {
    console.log(`${this.name} shutdown`);
    return true;
  }
}

module.exports = ExamplePlugin;
