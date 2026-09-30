/**
 * OmniRoute Global Plugin
 * Wrapper for globally installed omniroute CLI tool
 */

const { execSync } = require('child_process');

class OmniRouteGlobalPlugin {
  constructor(config = {}) {
    this.name = config.name || 'OmniRouteGlobalPlugin';
    this.version = config.version || '1.0.0';
    this.enabled = config.enabled !== false;
    this.omnirouteVersion = null;
    this.config = {};
    this.routes = [];
  }

  init() {
    if (!this.enabled) {
      console.log(`${this.name} is disabled`);
      return false;
    }

    try {
      // Check if omniroute is installed
      const version = execSync('omniroute --version 2>&1 || npx omniroute --version 2>&1', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();

      this.omnirouteVersion = version;
      console.log(`${this.name} v${this.version} initialized`);
      console.log(`  Global omniroute: ${version}`);
      return true;
    } catch (error) {
      console.log(`${this.name}: omniroute not found. Using npx fallback.`);
      return true;
    }
  }

  /**
   * Get omniroute version
   */
  getVersion() {
    try {
      const version = execSync('npx omniroute --version 2>&1', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();

      return { status: 'success', version };
    } catch (error) {
      return { status: 'error', message: 'omniroute not available' };
    }
  }

  /**
   * Execute omniroute command
   */
  executeCommand(args) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    try {
      const command = `npx omniroute ${args}`;
      const result = execSync(command, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();

      return {
        status: 'success',
        output: result,
        command: args
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        command: args
      };
    }
  }

  /**
   * Configure omniroute
   */
  config(configArgs) {
    return this.executeCommand(`config ${configArgs || ''}`);
  }

  /**
   * Get omniroute help
   */
  getHelp() {
    return this.executeCommand('--help');
  }

  /**
   * Get omniroute info
   */
  getInfo() {
    return {
      status: 'success',
      plugin: this.name,
      version: this.version,
      omnirouteVersion: this.omnirouteVersion,
      description: 'Global omniroute CLI wrapper',
      features: [
        'Route management',
        'Provider configuration',
        'Model orchestration',
        'CLI access'
      ]
    };
  }

  /**
   * Execute plugin logic
   */
  execute(input) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    const { action, args } = input;

    switch (action) {
      case 'version':
        return this.getVersion();
      case 'execute':
        return this.executeCommand(args);
      case 'config':
        return this.config(args);
      case 'help':
        return this.getHelp();
      case 'info':
        return this.getInfo();
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  shutdown() {
    console.log(`${this.name} shutdown`);
    return true;
  }
}

module.exports = OmniRouteGlobalPlugin;
