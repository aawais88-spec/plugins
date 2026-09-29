/**
 * Logger Plugin
 * Provides logging capabilities with multiple levels
 */

class LoggerPlugin {
  constructor(config = {}) {
    this.name = config.name || 'LoggerPlugin';
    this.version = config.version || '1.0.0';
    this.enabled = config.enabled !== false;
    this.level = config.level || 'info'; // debug, info, warn, error
    this.logs = [];
  }

  init() {
    if (!this.enabled) {
      console.log(`${this.name} is disabled`);
      return false;
    }
    console.log(`${this.name} v${this.version} initialized (level: ${this.level})`);
    return true;
  }

  /**
   * Log a message
   * @param {string} level - Log level
   * @param {string} message - Message to log
   * @param {any} data - Additional data
   */
  log(level, message, data = null) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    this.logs.push(logEntry);

    // Console output
    const prefix = `[${level.toUpperCase()}]`;
    console.log(`${prefix} ${message}`, data ? data : '');

    return logEntry;
  }

  debug(message, data) {
    return this.log('debug', message, data);
  }

  info(message, data) {
    return this.log('info', message, data);
  }

  warn(message, data) {
    return this.log('warn', message, data);
  }

  error(message, data) {
    return this.log('error', message, data);
  }

  /**
   * Get all logs
   */
  getLogs(filterLevel = null) {
    if (filterLevel) {
      return this.logs.filter(log => log.level === filterLevel);
    }
    return this.logs;
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Execute plugin logic
   */
  execute(input) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    const { action, level, message, data } = input;

    switch (action) {
      case 'log':
        return this.log(level, message, data);
      case 'getLogs':
        return this.getLogs(filterLevel);
      case 'clearLogs':
        this.clearLogs();
        return { status: 'success', message: 'Logs cleared' };
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  shutdown() {
    console.log(`${this.name} shutdown (${this.logs.length} logs collected)`);
    return true;
  }
}

module.exports = LoggerPlugin;
