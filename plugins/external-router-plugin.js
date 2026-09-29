/**
 * External Router Plugin
 * Manages external AI model providers and intelligent routing
 */

class ExternalRouterPlugin {
  constructor(config = {}) {
    this.name = config.name || 'ExternalRouterPlugin';
    this.version = config.version || '1.0.0';
    this.enabled = config.enabled !== false;
    this.providers = new Map();
    this.routing = new Map();
    this.usage = [];
    this.apiKeys = new Map();
    this.switches = new Map();
    this.fallbackChains = new Map();
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
   * Register external provider
   */
  registerProvider(name, config) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    this.providers.set(name, {
      name,
      type: config.type || 'api', // api, local, custom
      baseURL: config.baseURL,
      models: config.models || {},
      enabled: true,
      latency: 0,
      errors: 0,
      createdAt: new Date().toISOString()
    });

    if (config.apiKey) {
      this.apiKeys.set(name, config.apiKey);
    }

    return {
      status: 'success',
      message: `Provider ${name} registered`,
      provider: name,
      models: Object.keys(config.models || {}).length
    };
  }

  /**
   * Route request to external provider
   */
  routeToProvider(provider, model, prompt, params = {}) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    const providerData = this.providers.get(provider);
    if (!providerData) {
      throw new Error(`Provider ${provider} not found`);
    }

    if (!providerData.enabled) {
      throw new Error(`Provider ${provider} is disabled`);
    }

    const startTime = Date.now();
    const apiKey = this.apiKeys.get(provider) ? '***' : null;

    // Simulate API call with realistic latency
    const duration = Math.floor(Math.random() * 2000 + 500);

    const request = {
      id: this._generateId(),
      provider,
      model,
      prompt: prompt.substring(0, 100) + '...',
      duration,
      tokens: Math.floor(prompt.length / 4),
      timestamp: new Date().toISOString(),
      success: true,
      apiKey
    };

    this.usage.push(request);

    return {
      status: 'success',
      requestId: request.id,
      provider,
      model,
      duration,
      tokens: request.tokens,
      response: `Generated response from ${provider}/${model}`,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Add routing rule with switch
   */
  addRoutingRule(pattern, provider, model, options = {}) {
    this.routing.set(pattern, {
      pattern,
      provider,
      model,
      enabled: true,
      weight: options.weight || 1.0,
      priority: options.priority || 0,
      createdAt: new Date().toISOString()
    });

    return {
      status: 'success',
      message: `Routing rule added: ${pattern} → ${provider}/${model}`
    };
  }

  /**
   * Get routing rule
   */
  getRoute(pattern) {
    const route = this.routing.get(pattern);
    return route ? route : null;
  }

  /**
   * Add fallback chain
   */
  addFallbackChain(name, providers) {
    this.fallbackChains.set(name, {
      name,
      providers,
      createdAt: new Date().toISOString()
    });

    return {
      status: 'success',
      message: `Fallback chain ${name} added`,
      chain: providers
    };
  }

  /**
   * Route with fallback chain
   */
  routeWithFallback(chainName, prompt, params = {}) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    const chain = this.fallbackChains.get(chainName);
    if (!chain) {
      throw new Error(`Fallback chain ${chainName} not found`);
    }

    for (const [provider, model] of chain.providers) {
      try {
        return this.routeToProvider(provider, model, prompt, params);
      } catch (error) {
        // Continue to next provider
        continue;
      }
    }

    throw new Error(`All providers in chain ${chainName} failed`);
  }

  /**
   * Create a switch (toggle between providers)
   */
  createSwitch(name, provider1, provider2, initialState = 'provider1') {
    this.switches.set(name, {
      name,
      provider1,
      provider2,
      currentProvider: initialState === 'provider1' ? provider1 : provider2,
      switched: false,
      createdAt: new Date().toISOString()
    });

    return {
      status: 'success',
      message: `Switch ${name} created`,
      active: this.switches.get(name).currentProvider
    };
  }

  /**
   * Toggle switch between providers
   */
  toggleSwitch(name) {
    const sw = this.switches.get(name);
    if (!sw) {
      return { status: 'error', message: `Switch ${name} not found` };
    }

    sw.currentProvider = sw.currentProvider === sw.provider1 ? sw.provider2 : sw.provider1;
    sw.switched = !sw.switched;

    return {
      status: 'success',
      message: `Switch ${name} toggled`,
      currentProvider: sw.currentProvider
    };
  }

  /**
   * Get current provider from switch
   */
  getActiveProvider(switchName) {
    const sw = this.switches.get(switchName);
    if (!sw) {
      return { status: 'error', message: 'Switch not found' };
    }

    return {
      status: 'success',
      switchName,
      activeProvider: sw.currentProvider
    };
  }

  /**
   * Get provider status
   */
  getProviderStatus(name) {
    const provider = this.providers.get(name);
    if (!provider) {
      return { status: 'error', message: `Provider ${name} not found` };
    }

    const providerUsage = this.usage.filter(u => u.provider === name);
    const avgLatency = providerUsage.length > 0
      ? Math.round(providerUsage.reduce((sum, u) => sum + u.duration, 0) / providerUsage.length)
      : 0;

    const successRate = providerUsage.length > 0
      ? (providerUsage.filter(u => u.success).length / providerUsage.length * 100).toFixed(2)
      : 100;

    return {
      status: 'success',
      provider: name,
      type: provider.type,
      enabled: provider.enabled,
      avgLatency,
      successRate: `${successRate}%`,
      totalRequests: providerUsage.length,
      totalTokens: providerUsage.reduce((sum, u) => sum + u.tokens, 0),
      modelCount: Object.keys(provider.models).length
    };
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    const stats = {};
    for (const [provider] of this.providers) {
      stats[provider] = this.getProviderStatus(provider);
    }
    return {
      status: 'success',
      providers: stats,
      totalRequests: this.usage.length,
      totalTokens: this.usage.reduce((sum, u) => sum + u.tokens, 0)
    };
  }

  /**
   * List all providers
   */
  listProviders() {
    return {
      status: 'success',
      providers: Array.from(this.providers.values()),
      count: this.providers.size
    };
  }

  /**
   * List all routing rules
   */
  listRoutes() {
    return {
      status: 'success',
      routes: Array.from(this.routing.values()),
      count: this.routing.size
    };
  }

  /**
   * List all switches
   */
  listSwitches() {
    return {
      status: 'success',
      switches: Array.from(this.switches.values()),
      count: this.switches.size
    };
  }

  /**
   * Get usage history
   */
  getUsageHistory(limit = 20) {
    return {
      status: 'success',
      history: this.usage.slice(-limit),
      total: this.usage.length
    };
  }

  /**
   * Enable/disable provider
   */
  setProviderStatus(provider, enabled) {
    const p = this.providers.get(provider);
    if (!p) {
      return { status: 'error', message: 'Provider not found' };
    }

    p.enabled = enabled;
    return {
      status: 'success',
      message: `Provider ${provider} is now ${enabled ? 'enabled' : 'disabled'}`
    };
  }

  /**
   * Execute plugin logic
   */
  execute(input) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    const { action, provider, model, prompt, chainName, switchName, pattern } = input;

    switch (action) {
      case 'registerProvider':
        return this.registerProvider(provider, input);
      case 'routeToProvider':
        return this.routeToProvider(provider, model, prompt);
      case 'routeWithFallback':
        return this.routeWithFallback(chainName, prompt);
      case 'addRoutingRule':
        return this.addRoutingRule(pattern, provider, model);
      case 'createSwitch':
        return this.createSwitch(switchName, input.provider1, input.provider2);
      case 'toggleSwitch':
        return this.toggleSwitch(switchName);
      case 'getProviderStatus':
        return this.getProviderStatus(provider);
      case 'getUsageStats':
        return this.getUsageStats();
      case 'listProviders':
        return this.listProviders();
      case 'listRoutes':
        return this.listRoutes();
      case 'listSwitches':
        return this.listSwitches();
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Internal: Generate ID
   */
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  shutdown() {
    const stats = this.getUsageStats();
    console.log(`${this.name} shutdown (${stats.totalRequests} requests, ${stats.totalTokens} tokens)`);
    return true;
  }
}

module.exports = ExternalRouterPlugin;
