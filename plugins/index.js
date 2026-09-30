/**
 * Plugin Manager
 * Central hub for plugin management
 */

const ExamplePlugin = require('./example');
const LoggerPlugin = require('./logger');
const CachePlugin = require('./cache');
const OmniRoutePlugin = require('./omniroute-plugin');
const DatabasePlugin = require('./database-plugin');
const ExternalRouterPlugin = require('./external-router-plugin');
const AuthPlugin = require('./auth-plugin');
const OmniRouteGlobalPlugin = require('./omniroute-global-plugin');
const GraphifyyPlugin = require('./graphifyy-plugin');

class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.initialized = false;
  }

  /**
   * Register a plugin
   * @param {string} name - Plugin name
   * @param {Class} PluginClass - Plugin class
   * @param {Object} config - Configuration
   */
  register(name, PluginClass, config = {}) {
    const plugin = new PluginClass(config);
    this.plugins.set(name, plugin);
    console.log(`Registered plugin: ${name}`);
    return plugin;
  }

  /**
   * Get a plugin by name
   * @param {string} name - Plugin name
   */
  get(name) {
    return this.plugins.get(name);
  }

  /**
   * Initialize all plugins
   */
  initializeAll() {
    for (const [name, plugin] of this.plugins) {
      try {
        plugin.init();
      } catch (error) {
        console.error(`Failed to initialize ${name}:`, error.message);
      }
    }
    this.initialized = true;
  }

  /**
   * Shutdown all plugins
   */
  shutdownAll() {
    for (const [name, plugin] of this.plugins) {
      try {
        plugin.shutdown();
      } catch (error) {
        console.error(`Failed to shutdown ${name}:`, error.message);
      }
    }
    this.initialized = false;
  }

  /**
   * List all registered plugins
   */
  list() {
    return Array.from(this.plugins.keys());
  }
}

module.exports = { PluginManager, ExamplePlugin, LoggerPlugin, CachePlugin, OmniRoutePlugin, DatabasePlugin, ExternalRouterPlugin, AuthPlugin, OmniRouteGlobalPlugin, GraphifyyPlugin };
