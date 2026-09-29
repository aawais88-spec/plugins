# AI Model Routing Guide

Use OmniRoute to intelligently route requests to different AI models based on task requirements.

## Overview

With omniroute installed globally and as a plugin in your framework, you can:
- Route requests to different AI models (Claude, GPT, etc.)
- Load balance across multiple models
- Select models based on task complexity
- Cache model responses
- Log model usage and performance

## Setup

### 1. Global omniroute (CLI tool)

Omniroute is installed globally at:
```
C:\Users\aawai\AppData\Roaming\npm\omniroute
```

Use via npx:
```bash
npx omniroute --help
npx omniroute config
```

### 2. OmniRoute Plugin (Framework)

Already integrated in your plugin framework:
```javascript
const { PluginManager, OmniRoutePlugin } = require('./plugins');

const manager = new PluginManager();
manager.register('router', OmniRoutePlugin);
manager.initializeAll();

const router = manager.get('router');
```

## AI Model Routing Architecture

### Model Endpoints

Register endpoints for different AI models:

```javascript
const router = manager.get('router');

// Claude models (Fast)
router.post('/api/models/claude-haiku', claudeHaikuHandler);
router.post('/api/models/claude-sonnet', claudeSonnetHandler);
router.post('/api/models/claude-opus', claudeOpusHandler);

// OpenAI models
router.post('/api/models/gpt-4', gpt4Handler);
router.post('/api/models/gpt-3.5', gpt35Handler);

// Gemini models
router.post('/api/models/gemini-pro', geminiHandler);

// Local models
router.post('/api/models/llama', llamaHandler);
```

### Smart Routing Based on Task Type

```javascript
const router = manager.get('router');

// Quick tasks → Fast models (Haiku)
router.post('/api/quick-analysis', (req) => {
  const model = 'claude-haiku-4-5-20251001';
  return { model, endpoint: '/models/claude-haiku' };
});

// Complex reasoning → Advanced models (Opus)
router.post('/api/complex-reasoning', (req) => {
  const model = 'claude-opus-5-5';
  return { model, endpoint: '/models/claude-opus' };
});

// Balanced tasks → Middle tier (Sonnet)
router.post('/api/standard-task', (req) => {
  const model = 'claude-sonnet-5-5';
  return { model, endpoint: '/models/claude-sonnet' };
});

// Image analysis → Vision models
router.post('/api/vision/:model', (req) => {
  const model = req.params.model;
  return { model, endpoint: `/models/vision/${model}` };
});

// Code generation → Code-optimized models
router.post('/api/code-generation', (req) => {
  const model = 'claude-opus-5-5'; // Best for code
  return { model, endpoint: '/models/claude-opus' };
});
```

### Load Balancing

```javascript
const models = [
  'claude-haiku-4-5-20251001',
  'claude-sonnet-5-5',
  'claude-opus-5-5'
];

let currentModel = 0;

router.post('/api/load-balanced', (req) => {
  const model = models[currentModel % models.length];
  currentModel++;
  return { model, balanced: true };
});
```

### Performance-Based Routing

```javascript
const modelStats = new Map();

function updateModelStats(model, duration) {
  if (!modelStats.has(model)) {
    modelStats.set(model, { total: 0, count: 0 });
  }
  const stats = modelStats.get(model);
  stats.total += duration;
  stats.count++;
}

function getFastestModel() {
  let fastest = null;
  let minAvg = Infinity;
  
  for (const [model, stats] of modelStats) {
    const avg = stats.total / stats.count;
    if (avg < minAvg) {
      minAvg = avg;
      fastest = model;
    }
  }
  
  return fastest || 'claude-haiku-4-5-20251001';
}

router.post('/api/fastest', (req) => {
  const model = getFastestModel();
  return { model, strategy: 'performance-based' };
});
```

## Integration with Database & Logger

### Track Model Usage

```javascript
const { PluginManager, OmniRoutePlugin, DatabasePlugin, LoggerPlugin } = require('./plugins');

const manager = new PluginManager();
manager.register('router', OmniRoutePlugin);
manager.register('db', DatabasePlugin);
manager.register('logger', LoggerPlugin);
manager.initializeAll();

const router = manager.get('router');
const db = manager.get('db');
const logger = manager.get('logger');

// Create usage tracking table
db.createTable('model_usage', {
  id: 'INT PRIMARY KEY',
  model: 'VARCHAR(100)',
  task: 'VARCHAR(255)',
  duration: 'INT',
  tokens: 'INT',
  timestamp: 'TIMESTAMP'
});

// Track usage
router.post('/api/models/:model', (req) => {
  const model = req.params.model;
  const startTime = Date.now();
  
  try {
    const result = callModel(model, req.body);
    const duration = Date.now() - startTime;
    
    // Log usage
    db.insert('model_usage', {
      model,
      task: req.body.type,
      duration,
      tokens: result.tokens,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Model called', {
      model,
      duration,
      tokens: result.tokens
    });
    
    return result;
  } catch (error) {
    logger.error('Model error', { model, error: error.message });
    throw error;
  }
});
```

### Cache Responses

```javascript
const { CachePlugin } = require('./plugins');

const manager = new PluginManager();
const cache = manager.get('cache');
const router = manager.get('router');

router.post('/api/cached-request', (req) => {
  const cacheKey = `${req.body.prompt.substring(0, 50)}:${req.body.model}`;
  
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    logger.info('Cache hit', { model: req.body.model });
    return { ...cached, cached: true };
  }
  
  // Call model
  const result = callModel(req.body.model, req.body);
  
  // Cache result (1 hour)
  cache.set(cacheKey, result, 3600000);
  
  return { ...result, cached: false };
});
```

## Real-World Examples

### Multi-Model API Server

```javascript
const { PluginManager, OmniRoutePlugin, LoggerPlugin, DatabasePlugin } = require('./plugins');

const manager = new PluginManager();
manager.register('router', OmniRoutePlugin);
manager.register('logger', LoggerPlugin);
manager.register('db', DatabasePlugin);
manager.initializeAll();

const router = manager.get('router');
const logger = manager.get('logger');

// Setup routes
setupAIRoutes(router, logger);

function setupAIRoutes(router, logger) {
  // Quick analysis → Haiku (fastest, cheapest)
  router.post('/api/quick', (req) => {
    logger.info('Quick analysis requested');
    return {
      model: 'claude-haiku-4-5-20251001',
      type: 'fast',
      maxTokens: 2000
    };
  });

  // Standard analysis → Sonnet (balanced)
  router.post('/api/standard', (req) => {
    logger.info('Standard analysis requested');
    return {
      model: 'claude-sonnet-5-5',
      type: 'balanced',
      maxTokens: 4000
    };
  });

  // Complex reasoning → Opus (most capable)
  router.post('/api/complex', (req) => {
    logger.info('Complex reasoning requested');
    return {
      model: 'claude-opus-5-5',
      type: 'advanced',
      maxTokens: 8000
    };
  });

  // Automatic selection based on complexity
  router.post('/api/auto', (req) => {
    const complexity = estimateComplexity(req.body.prompt);
    
    let model = 'claude-haiku-4-5-20251001';
    if (complexity > 0.7) {
      model = 'claude-opus-5-5';
    } else if (complexity > 0.4) {
      model = 'claude-sonnet-5-5';
    }
    
    logger.info('Auto routing', { complexity, model });
    return { model, complexity };
  });
}

function estimateComplexity(prompt) {
  const length = prompt.length;
  const hasCodewords = /code|algorithm|optimize|architecture/i.test(prompt);
  const hasReasoningKeywords = /why|how|analyze|explain/i.test(prompt);
  
  let score = Math.min(length / 1000, 0.4);
  if (hasCodewords) score += 0.3;
  if (hasReasoningKeywords) score += 0.3;
  
  return Math.min(score, 1.0);
}
```

### Token-Optimized Routing

```javascript
// Your current setup: Haiku by default for token efficiency

router.post('/api/request', (req) => {
  const haiku = 'claude-haiku-4-5-20251001';      // Default (fastest, cheapest)
  const sonnet = 'claude-sonnet-5-5';             // Fallback (balanced)
  const opus = 'claude-opus-5-5';                 // Complex (most capable)
  
  // Start with Haiku for efficiency
  let model = haiku;
  
  // Upgrade if needed
  if (req.body.requiresCode) {
    model = opus;  // Code generation → Opus
  } else if (req.body.complexity > 0.5) {
    model = sonnet;  // Medium complexity → Sonnet
  }
  
  return {
    model,
    maxTokens: req.body.maxTokens || 2000,
    temperature: req.body.temperature || 0.7
  };
});
```

## Available Claude Models

| Model | Speed | Cost | Best For |
|-------|-------|------|----------|
| **claude-haiku-4-5-20251001** | ⚡⚡⚡ | $ | Quick analysis, summaries |
| **claude-sonnet-5-5** | ⚡⚡ | $$ | Balanced tasks, coding |
| **claude-opus-5-5** | ⚡ | $$$ | Complex reasoning, planning |

## Monitoring & Metrics

Get routing statistics:

```javascript
const stats = router.stats();
// {
//   totalRoutes: 8,
//   methods: { POST: 6, GET: 2 },
//   middlewareCount: 1,
//   enabled: true
// }

// Get routes by method
const postRoutes = router.getRoutesByMethod('POST');
// Array of all POST routes to different models
```

## Configuration

Configure omniroute plugin for AI routing:

```javascript
manager.register('router', OmniRoutePlugin, {
  name: 'AI Model Router',
  basePrefix: '/api/models',
  caseSensitive: false
});
```

## Best Practices

1. **Start with Haiku** - Default to fastest model for token efficiency
2. **Upgrade when needed** - Use Sonnet for complex tasks
3. **Use Opus sparingly** - Reserve for complex reasoning
4. **Cache responses** - Avoid redundant API calls
5. **Track usage** - Monitor model performance and costs
6. **Log everything** - Debug routing decisions

## Future Enhancements

- [ ] Automatic model selection based on task
- [ ] Cost optimization
- [ ] Token counting
- [ ] Fallback chains
- [ ] Rate limiting per model
- [ ] A/B testing routes
- [ ] Metrics dashboard

---

**Your omniroute setup is ready for multi-model AI routing! 🚀**

Use it to intelligently route requests between Claude Haiku, Sonnet, and Opus based on task requirements while maintaining token efficiency.
