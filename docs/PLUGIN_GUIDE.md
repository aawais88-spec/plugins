# Plugin Development Guide

## Overview
This guide explains how to create and manage plugins in this project.

## Plugin Structure

Every plugin should follow this basic structure:

```javascript
class MyPlugin {
  constructor(config = {}) {
    this.name = config.name || 'MyPlugin';
    this.version = config.version || '1.0.0';
    this.enabled = config.enabled !== false;
  }

  init() {
    // Initialize plugin
  }

  execute(input) {
    // Execute plugin logic
  }

  shutdown() {
    // Cleanup
  }
}
```

## Creating a Plugin

1. **Create a new file** in `/plugins` directory
2. **Extend the base plugin pattern** from `example.js`
3. **Implement required methods**: `init()`, `execute()`, `shutdown()`
4. **Export the class** as module.exports

### Example

```javascript
// plugins/my-plugin.js
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
    return { result: input };
  }

  shutdown() {
    console.log(`${this.name} shutdown`);
  }
}

module.exports = MyPlugin;
```

## Registering a Plugin

Use the PluginManager to register plugins:

```javascript
const { PluginManager, ExamplePlugin } = require('./plugins');

const manager = new PluginManager();
manager.register('example', ExamplePlugin);
manager.initializeAll();
```

## Testing

Write tests in `/tests` following Jest conventions:

```javascript
test('should do something', () => {
  const plugin = new MyPlugin();
  plugin.init();
  const result = plugin.execute({ data: 'test' });
  expect(result).toBeDefined();
});
```

Run tests:
```bash
npm test
npm run test:coverage
```

## Best Practices

1. **Error Handling**: Always handle errors gracefully
2. **Configuration**: Accept config in constructor
3. **Logging**: Use console for debugging
4. **Cleanup**: Implement proper shutdown
5. **Testing**: Write tests for all plugins
6. **Documentation**: Document complex logic

## Plugin Lifecycle

1. **Create** → Define plugin class
2. **Register** → Add to PluginManager
3. **Initialize** → Call `init()`
4. **Execute** → Call `execute(input)`
5. **Shutdown** → Call `shutdown()`

## Common Patterns

### Conditional Execution
```javascript
execute(input) {
  if (!this.enabled) {
    throw new Error('Plugin is disabled');
  }
  // Execute logic
}
```

### State Management
```javascript
constructor(config) {
  this.state = new Map();
}

setState(key, value) {
  this.state.set(key, value);
}

getState(key) {
  return this.state.get(key);
}
```

### Error Handling
```javascript
execute(input) {
  try {
    // Process input
    return { status: 'success', data: result };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}
```
