/**
 * OmniRoute Plugin
 * Provides advanced routing capabilities for the plugin framework
 */

class OmniRoutePlugin {
  constructor(config = {}) {
    this.name = config.name || 'OmniRoutePlugin';
    this.version = config.version || '1.0.0';
    this.enabled = config.enabled !== false;
    this.routes = new Map();
    this.middleware = [];
    this.basePrefix = config.basePrefix || '';
    this.caseSensitive = config.caseSensitive !== false;
  }

  init() {
    if (!this.enabled) {
      console.log(`${this.name} is disabled`);
      return false;
    }
    console.log(`${this.name} v${this.version} initialized`);
    return true;
  }

  /**
   * Register a route
   * @param {string} method - HTTP method (GET, POST, etc)
   * @param {string} path - Route path
   * @param {Function} handler - Route handler function
   */
  route(method, path, handler) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    const key = this._getRouteKey(method, path);
    this.routes.set(key, {
      method: method.toUpperCase(),
      path,
      handler,
      registered: new Date().toISOString()
    });

    return {
      status: 'success',
      message: `Route registered: ${method.toUpperCase()} ${path}`,
      key
    };
  }

  /**
   * Register GET route
   */
  get(path, handler) {
    return this.route('GET', path, handler);
  }

  /**
   * Register POST route
   */
  post(path, handler) {
    return this.route('POST', path, handler);
  }

  /**
   * Register PUT route
   */
  put(path, handler) {
    return this.route('PUT', path, handler);
  }

  /**
   * Register DELETE route
   */
  delete(path, handler) {
    return this.route('DELETE', path, handler);
  }

  /**
   * Register PATCH route
   */
  patch(path, handler) {
    return this.route('PATCH', path, handler);
  }

  /**
   * Match a route
   * @param {string} method - HTTP method
   * @param {string} path - Request path
   * @returns {Object} Matched route or null
   */
  match(method, path) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    // Direct match
    const key = this._getRouteKey(method, path);
    if (this.routes.has(key)) {
      return this.routes.get(key);
    }

    // Pattern match with wildcards
    for (const [routeKey, route] of this.routes) {
      if (this._matchPattern(path, route.path)) {
        return route;
      }
    }

    return null;
  }

  /**
   * Add middleware
   * @param {Function} middlewareFunc - Middleware function
   */
  use(middlewareFunc) {
    if (typeof middlewareFunc !== 'function') {
      throw new Error('Middleware must be a function');
    }
    this.middleware.push(middlewareFunc);
    return { status: 'success', message: 'Middleware added' };
  }

  /**
   * Get all routes
   */
  getRoutes() {
    return Array.from(this.routes.values());
  }

  /**
   * Get routes by method
   * @param {string} method - HTTP method
   */
  getRoutesByMethod(method) {
    const uppercaseMethod = method.toUpperCase();
    return this.getRoutes().filter(route => route.method === uppercaseMethod);
  }

  /**
   * Clear all routes
   */
  clearRoutes() {
    this.routes.clear();
    return { status: 'success', message: 'All routes cleared' };
  }

  /**
   * Remove a specific route
   */
  removeRoute(method, path) {
    const key = this._getRouteKey(method, path);
    if (this.routes.has(key)) {
      this.routes.delete(key);
      return { status: 'success', message: `Route removed: ${method} ${path}` };
    }
    return { status: 'error', message: `Route not found: ${method} ${path}` };
  }

  /**
   * Execute plugin logic
   */
  execute(input) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    const { action, method, path, handler } = input;

    switch (action) {
      case 'register':
        return this.route(method, path, handler);
      case 'match':
        const matched = this.match(method, path);
        return matched ? matched : { status: 'not_found', path, method };
      case 'getRoutes':
        return { status: 'success', routes: this.getRoutes() };
      case 'getByMethod':
        return { status: 'success', routes: this.getRoutesByMethod(method) };
      case 'clear':
        return this.clearRoutes();
      case 'remove':
        return this.removeRoute(method, path);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Internal: Get route key
   */
  _getRouteKey(method, path) {
    const normalizedPath = this.caseSensitive ? path : path.toLowerCase();
    return `${method.toUpperCase()}:${normalizedPath}`;
  }

  /**
   * Internal: Match route pattern
   */
  _matchPattern(requestPath, routePath) {
    // Convert route pattern to regex
    // e.g., /users/:id -> /users/123
    const pattern = routePath
      .replace(/\//g, '\\/')
      .replace(/:[a-zA-Z_][a-zA-Z0-9_]*/g, '[^/]+');

    const regex = new RegExp(`^${pattern}$`);
    return regex.test(requestPath);
  }

  /**
   * Get route statistics
   */
  stats() {
    const routes = this.getRoutes();
    const methodCounts = {};

    routes.forEach(route => {
      methodCounts[route.method] = (methodCounts[route.method] || 0) + 1;
    });

    return {
      totalRoutes: routes.length,
      methods: methodCounts,
      middlewareCount: this.middleware.length,
      enabled: this.enabled
    };
  }

  shutdown() {
    const stats = this.stats();
    console.log(`${this.name} shutdown (${stats.totalRoutes} routes cleared)`);
    this.routes.clear();
    this.middleware = [];
    return true;
  }
}

module.exports = OmniRoutePlugin;
