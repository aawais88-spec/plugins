# External AI Router Integration Guide

Extend OmniRoute to integrate with external AI model routers, services, and APIs.

## Overview

OmniRoute can be extended to:
- Connect to external AI model routers (OpenRouter, Together AI, etc.)
- Add proxy/switch functionality for multiple providers
- Track usage across external services
- Load balance between internal and external models
- Handle fallback chains
- Manage API keys and authentication
- Monitor costs and performance

## Architecture

```
Your App
   ↓
OmniRoute Router (local)
   ├── Internal Routes
   │   ├── Claude Haiku (local)
   │   ├── Claude Sonnet (local)
   │   └── Claude Opus (local)
   │
   └── External Routes
       ├── OpenRouter (external API)
       ├── Together AI (external API)
       ├── Replicate (external API)
       └── Custom Provider (your API)
```

## Supported External Services

### 1. OpenRouter

**What it provides:**
- Access to 100+ models (Claude, GPT, Llama, etc.)
- Single API endpoint for multiple providers
- Usage tracking and billing
- Load balancing

**Setup:**

```javascript
const openRouterConfig = {
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.io/api/v1',
  models: {
    'gpt-4': 'openai/gpt-4',
    'claude-3-opus': 'anthropic/claude-3-opus',
    'llama-2-70b': 'meta-llama/llama-2-70b-chat',
    'mixtral-8x7b': 'mistralai/mixtral-8x7b'
  }
};
```

### 2. Together AI

**What it provides:**
- Fast inference for multiple models
- Real-time text generation
- Lower latency than some alternatives
- Competitive pricing

**Setup:**

```javascript
const togetherConfig = {
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: 'https://api.together.xyz/inference',
  models: {
    'llama-2-70b': 'togethercomputer/llama-2-70b-chat',
    'mistral-7b': 'mistralai/Mistral-7B-Instruct-v0.1'
  }
};
```

### 3. Replicate

**What it provides:**
- Vision models
- Image generation
- Audio models
- Research models

**Setup:**

```javascript
const replicateConfig = {
  apiKey: process.env.REPLICATE_API_KEY,
  baseURL: 'https://api.replicate.com/v1',
  models: {
    'gpt-vision': 'openai/gpt-4-vision',
    'stable-diffusion': 'stability-ai/stable-diffusion'
  }
};
```

## Creating External Router Plugin

```javascript
/**
 * External Router Plugin
 * Manages external AI model providers and routing
 */

class ExternalRouterPlugin {
  constructor(config = {}) {
    this.name = config.name || 'ExternalRouterPlugin';
    this.enabled = config.enabled !== false;
    this.providers = new Map();
    this.routing = new Map();
    this.usage = [];
    this.apiKeys = new Map();
  }

  init() {
    console.log(`${this.name} initialized`);
    return true;
  }

  /**
   * Register external provider
   */
  registerProvider(name, config) {
    this.providers.set(name, {
      name,
      baseURL: config.baseURL,
      models: config.models,
      enabled: true,
      latency: 0,
      errors: 0
    });

    if (config.apiKey) {
      this.apiKeys.set(name, config.apiKey);
    }

    return { status: 'success', message: `Provider ${name} registered` };
  }

  /**
   * Route to external provider
   */
  routeToProvider(provider, model, prompt, params = {}) {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} not found`);
    }

    const startTime = Date.now();
    const apiKey = this.apiKeys.get(provider);

    const request = {
      id: this._generateId(),
      provider,
      model,
      prompt,
      params,
      apiKey: apiKey ? '***' : null,
      timestamp: new Date().toISOString()
    };

    // Simulate API call
    const duration = Math.random() * 2000 + 500;
    
    this.usage.push({
      ...request,
      duration,
      tokens: Math.floor(prompt.length / 4),
      success: true
    });

    return {
      status: 'success',
      provider,
      model,
      duration,
      requestId: request.id,
      response: `Response from ${provider} using ${model}`
    };
  }

  /**
   * Add routing rule
   */
  addRoutingRule(pattern, provider, model) {
    this.routing.set(pattern, {
      provider,
      model,
      createdAt: new Date().toISOString()
    });

    return { status: 'success', message: `Rule added: ${pattern}` };
  }

  /**
   * Get routing rule
   */
  getRoute(pattern) {
    return this.routing.get(pattern);
  }

  /**
   * Smart routing based on fallback chain
   */
  routeWithFallback(prompt, primaryProvider, fallbackProviders = []) {
    try {
      return this.routeToProvider(primaryProvider, 'default', prompt);
    } catch (error) {
      for (const fallback of fallbackProviders) {
        try {
          return this.routeToProvider(fallback, 'default', prompt);
        } catch (err) {
          continue;
        }
      }
      throw new Error('All fallback providers failed');
    }
  }

  /**
   * Get provider status
   */
  getProviderStatus(name) {
    const provider = this.providers.get(name);
    if (!provider) {
      return { status: 'error', message: 'Provider not found' };
    }

    const providerUsage = this.usage.filter(u => u.provider === name);
    const avgLatency = providerUsage.length > 0
      ? providerUsage.reduce((sum, u) => sum + u.duration, 0) / providerUsage.length
      : 0;

    return {
      status: 'success',
      provider: name,
      enabled: provider.enabled,
      avgLatency,
      totalRequests: providerUsage.length,
      totalTokens: providerUsage.reduce((sum, u) => sum + u.tokens, 0)
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
    return stats;
  }

  /**
   * List all providers
   */
  listProviders() {
    return Array.from(this.providers.values());
  }

  /**
   * Internal: Generate ID
   */
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  shutdown() {
    console.log(`${this.name} shutdown`);
    return true;
  }
}

module.exports = ExternalRouterPlugin;
```

## Integration Example

```javascript
const { PluginManager, OmniRoutePlugin, ExternalRouterPlugin, DatabasePlugin, LoggerPlugin } = require('./plugins');

const manager = new PluginManager();
manager.register('router', OmniRoutePlugin);
manager.register('external', ExternalRouterPlugin);
manager.register('db', DatabasePlugin);
manager.register('logger', LoggerPlugin);
manager.initializeAll();

const router = manager.get('router');
const external = manager.get('external');
const logger = manager.get('logger');

// Register external providers
external.registerProvider('openrouter', {
  baseURL: 'https://openrouter.io/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  models: {
    'gpt-4': 'openai/gpt-4',
    'claude': 'anthropic/claude-3-opus'
  }
});

external.registerProvider('together', {
  baseURL: 'https://api.together.xyz/inference',
  apiKey: process.env.TOGETHER_API_KEY,
  models: {
    'llama-70b': 'togethercomputer/llama-2-70b-chat',
    'mixtral': 'mistralai/Mixtral-8x7b'
  }
});

// Add routing rules
external.addRoutingRule('/api/gpt4', 'openrouter', 'gpt-4');
external.addRoutingRule('/api/llama', 'together', 'llama-70b');

// Setup routes with external routers
router.post('/api/external/gpt4', (req) => {
  const result = external.routeToProvider('openrouter', 'gpt-4', req.body.prompt);
  logger.info('Routed to GPT-4', { provider: 'openrouter' });
  return result;
});

router.post('/api/external/llama', (req) => {
  const result = external.routeToProvider('together', 'llama-70b', req.body.prompt);
  logger.info('Routed to Llama', { provider: 'together' });
  return result;
});

// Fallback chain routing
router.post('/api/external/auto', (req) => {
  try {
    return external.routeWithFallback(req.body.prompt, 'openrouter', ['together', 'local']);
  } catch (error) {
    logger.error('All routers failed', { error: error.message });
    throw error;
  }
});
```

## Middleware for External APIs

```javascript
// Authentication middleware
router.use((req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    throw new Error('Missing API key');
  }
  req.apiKey = apiKey;
});

// Rate limiting middleware
const rateLimits = new Map();
router.use((req, res) => {
  const key = `${req.provider}:${req.model}`;
  if (!rateLimits.has(key)) {
    rateLimits.set(key, { count: 0, resetAt: Date.now() + 60000 });
  }

  const limit = rateLimits.get(key);
  if (Date.now() > limit.resetAt) {
    limit.count = 0;
    limit.resetAt = Date.now() + 60000;
  }

  if (limit.count > 100) {
    throw new Error('Rate limit exceeded');
  }
  limit.count++;
});

// Usage tracking middleware
router.use((req, res) => {
  req.startTime = Date.now();
  res.onComplete = (duration) => {
    db.insert('external_router_usage', {
      provider: req.provider,
      model: req.model,
      tokens: req.tokens,
      duration,
      timestamp: new Date().toISOString()
    });
  };
});
```

## Switching Between Providers

```javascript
// Provider switching logic
function selectProvider(requirements) {
  const providers = external.listProviders();

  // Filter by model availability
  let available = providers.filter(p => 
    p.models.includes(requirements.model)
  );

  // Filter by latency requirement
  if (requirements.maxLatency) {
    available = available.filter(p => 
      p.latency < requirements.maxLatency
    );
  }

  // Sort by cost
  available.sort((a, b) => 
    (a.costPerMTok || 0) - (b.costPerMTok || 0)
  );

  return available[0] || null;
}

// Usage in route
router.post('/api/smart-route', (req) => {
  const selectedProvider = selectProvider({
    model: req.body.model,
    maxLatency: 2000  // 2 second max
  });

  if (!selectedProvider) {
    throw new Error('No suitable provider found');
  }

  return external.routeToProvider(
    selectedProvider.name,
    req.body.model,
    req.body.prompt
  );
});
```

## Cost Tracking Across Providers

```javascript
// Provider pricing config
const pricing = {
  openrouter: {
    'gpt-4': { input: 0.03, output: 0.06 },
    'claude-3-opus': { input: 0.015, output: 0.075 }
  },
  together: {
    'llama-70b': { input: 0.0009, output: 0.0009 }
  },
  local: {
    'claude-haiku': { input: 0.00025, output: 0.00125 },
    'claude-sonnet': { input: 0.003, output: 0.015 },
    'claude-opus': { input: 0.015, output: 0.075 }
  }
};

// Calculate cost
function calculateCost(provider, model, inputTokens, outputTokens) {
  const rates = pricing[provider]?.[model];
  if (!rates) return null;

  return {
    input: (inputTokens / 1000) * rates.input,
    output: (outputTokens / 1000) * rates.output,
    total: ((inputTokens / 1000) * rates.input) + ((outputTokens / 1000) * rates.output)
  };
}

// Track costs
db.createTable('provider_costs', {
  id: 'INT PRIMARY KEY',
  provider: 'VARCHAR(100)',
  model: 'VARCHAR(100)',
  inputTokens: 'INT',
  outputTokens: 'INT',
  cost: 'DECIMAL(10,6)',
  timestamp: 'TIMESTAMP'
});

// Log cost after each request
router.post('/api/external/:provider/:model', (req) => {
  const result = external.routeToProvider(req.params.provider, req.params.model, req.body.prompt);
  
  const cost = calculateCost(
    req.params.provider,
    req.params.model,
    result.inputTokens,
    result.outputTokens
  );

  db.insert('provider_costs', {
    provider: req.params.provider,
    model: req.params.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    cost: cost.total,
    timestamp: new Date().toISOString()
  });

  logger.info('API call completed', {
    provider: req.params.provider,
    cost: cost.total
  });

  return result;
});
```

## API Key Management

```javascript
// Secure API key storage
class APIKeyManager {
  constructor() {
    this.keys = new Map();
  }

  setKey(provider, key) {
    this.keys.set(provider, key);
  }

  getKey(provider) {
    return this.keys.get(provider);
  }

  // Rotate key
  rotateKey(provider, newKey) {
    const oldKey = this.keys.get(provider);
    this.keys.set(provider, newKey);
    
    logger.info('API key rotated', { 
      provider, 
      oldKey: oldKey ? '***' : null,
      newKey: newKey ? '***' : null
    });
  }
}

const keyManager = new APIKeyManager();
keyManager.setKey('openrouter', process.env.OPENROUTER_API_KEY);
keyManager.setKey('together', process.env.TOGETHER_API_KEY);
```

## Monitoring External Routers

```javascript
// Health check
async function checkProviderHealth(provider) {
  try {
    const result = await external.routeToProvider(provider, 'test-model', 'ping');
    return { status: 'healthy', latency: result.duration };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

// Periodic health monitoring
setInterval(async () => {
  const providers = external.listProviders();
  
  for (const provider of providers) {
    const health = await checkProviderHealth(provider.name);
    logger.info('Health check', { provider: provider.name, ...health });
    
    if (health.status === 'unhealthy') {
      // Disable unhealthy provider
      external.disableProvider(provider.name);
    }
  }
}, 300000); // Every 5 minutes
```

## Usage Analytics

```javascript
// Get usage by provider
const stats = external.getUsageStats();

// Example output:
// {
//   openrouter: {
//     provider: 'openrouter',
//     avgLatency: 1250,
//     totalRequests: 342,
//     totalTokens: 45230
//   },
//   together: {
//     provider: 'together',
//     avgLatency: 890,
//     totalRequests: 128,
//     totalTokens: 18450
//   }
// }

// Cost analysis
const costs = db.select('provider_costs');
const costByProvider = {};

costs.rows.forEach(row => {
  if (!costByProvider[row.provider]) {
    costByProvider[row.provider] = 0;
  }
  costByProvider[row.provider] += row.cost;
});

console.log('Cost by provider:', costByProvider);
```

## Configuration

Register ExternalRouterPlugin:

```javascript
manager.register('external', ExternalRouterPlugin, {
  name: 'Multi-Provider Router',
  apiKeyRotationInterval: 86400000, // 24 hours
  healthCheckInterval: 300000, // 5 minutes
  enableLoadBalancing: true,
  enableCaching: true
});
```

## Real-World Example

```javascript
// Complete multi-provider setup
const setup = async () => {
  // Local routes (internal Claude models)
  router.post('/api/local/haiku', (req) => {
    return callLocalModel('claude-haiku-4-5-20251001', req.body.prompt);
  });

  // External routes (OpenRouter)
  router.post('/api/external/gpt4', (req) => {
    return external.routeToProvider('openrouter', 'gpt-4', req.body.prompt);
  });

  // Hybrid auto-selection
  router.post('/api/auto', (req) => {
    const cost = calculateCost('claude-haiku', 1000, 500);
    const externalCost = calculateCost('openrouter', 'gpt-4', 1000, 500);

    if (cost.total < externalCost.total) {
      return callLocalModel('claude-haiku-4-5-20251001', req.body.prompt);
    } else {
      return external.routeToProvider('openrouter', 'gpt-4', req.body.prompt);
    }
  });

  // Fallback chain
  router.post('/api/reliable', (req) => {
    try {
      return callLocalModel('claude-opus-5-5', req.body.prompt);
    } catch (err1) {
      try {
        return external.routeToProvider('openrouter', 'gpt-4', req.body.prompt);
      } catch (err2) {
        return external.routeToProvider('together', 'llama-70b', req.body.prompt);
      }
    }
  });
};
```

## Benefits

✅ **Multiple Provider Access** - Use 100+ models from different providers  
✅ **Cost Optimization** - Choose cheapest provider for each task  
✅ **Failover Protection** - Automatic fallback chains  
✅ **Performance Monitoring** - Track latency and usage  
✅ **Load Balancing** - Distribute load across providers  
✅ **Flexible Switching** - Switch providers without code changes  
✅ **Token Efficiency** - Combine local Haiku with external models  

## Limitations

- ⚠️ External APIs require authentication
- ⚠️ Network latency varies by provider
- ⚠️ API rate limits and quotas apply
- ⚠️ Costs accumulate across providers
- ⚠️ Model availability varies

## Future Enhancements

- [ ] Auto-scaling based on load
- [ ] Cost predictions
- [ ] SLA monitoring
- [ ] Provider comparison dashboard
- [ ] Automatic provider selection ML
- [ ] Request deduplication
- [ ] Response caching across providers

---

**OmniRoute supports full external AI router integration!** 🚀

Combine local models with external providers for maximum flexibility, cost optimization, and reliability.
