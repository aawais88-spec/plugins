# Quick Start Guide

Get up and running with the plugin framework in 5 minutes.

## Installation

```bash
# Install dependencies
npm install

# Run tests to verify setup
npm test

# Run demo
node demo.js
```

## Create Your First Plugin

### 1. Create Plugin File

Create `plugins/my-plugin.js`:

```javascript
class MyPlugin {
  constructor(config = {}) {
    this.name = config.name || 'MyPlugin';
    this.enabled = config.enabled !== false;
  }

  init() {
    console.log(`${this.name} initialized`);
    return true;
  }

  execute(input) {
    return { result: 'success', input };
  }

  shutdown() {
    console.log(`${this.name} shutdown`);
  }
}

module.exports = MyPlugin;
```

### 2. Use Your Plugin

```javascript
const { PluginManager } = require('./plugins');
const MyPlugin = require('./plugins/my-plugin');

const manager = new PluginManager();
manager.register('my-plugin', MyPlugin);
manager.initializeAll();

const plugin = manager.get('my-plugin');
const result = plugin.execute({ data: 'test' });

manager.shutdownAll();
```

## Available Plugins

### ExamplePlugin
Basic plugin template with lifecycle methods.

### LoggerPlugin
Multi-level logging (debug, info, warn, error).

```javascript
const logger = manager.get('logger');
logger.info('User logged in', { userId: 123 });
logger.warn('High memory usage', { mb: 512 });
const logs = logger.getLogs();
```

### CachePlugin
In-memory cache with TTL support.

```javascript
const cache = manager.get('cache');
cache.set('key', { data: 'value' }, 5000); // 5 second TTL
const value = cache.get('key');
cache.clear();
```

## Running Commands

```bash
# Run tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Test coverage report
npm run test:coverage

# Lint code
npm run lint

# Run demo
node demo.js

# Start app
npm start
```

## Project Structure

```
.
├── plugins/           # Plugin implementations
│   ├── index.js      # PluginManager
│   ├── example.js    # Example plugin
│   ├── logger.js     # Logger plugin
│   └── cache.js      # Cache plugin
├── tests/            # Test files
│   └── example.test.js
├── docs/             # Documentation
│   ├── QUICK_START.md (this file)
│   ├── PLUGIN_GUIDE.md
│   └── ARCHITECTURE.md
├── demo.js           # Demo script
├── package.json      # NPM config
└── CLAUDE.md         # Dev guidelines
```

## Common Tasks

### Add a new plugin
1. Create file in `plugins/`
2. Implement plugin class
3. Write tests in `tests/`
4. Register with PluginManager
5. Run `npm test`

### Debug a plugin
```javascript
// In your code
const plugin = manager.get('my-plugin');
plugin.init();
console.log(plugin); // Inspect plugin state
```

### Add plugin configuration
```javascript
manager.register('plugin-name', PluginClass, {
  name: 'Custom Name',
  version: '1.1.0',
  enabled: true,
  // Custom config
  option1: 'value1'
});
```

## Troubleshooting

### Tests fail
```bash
npm test -- --verbose
```

### Plugin not working
- Check if plugin is enabled
- Verify init() was called
- Check console logs for errors

### Cache not storing data
- Verify TTL hasn't expired
- Check cache.size() to confirm
- Use cache.get() to retrieve

## Next Steps

- [ ] Read PLUGIN_GUIDE.md for detailed plugin creation
- [ ] Check ARCHITECTURE.md for system design
- [ ] Run `npm run test:coverage` to see test coverage
- [ ] Create your first custom plugin
- [ ] Add to GitHub or your VCS

## Resources

- [PLUGIN_GUIDE.md](./PLUGIN_GUIDE.md) - Detailed plugin development
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [../demo.js](../demo.js) - Working example
