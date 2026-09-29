/**
 * Example Plugin Tests
 */

const ExamplePlugin = require('../plugins/example');

describe('ExamplePlugin', () => {
  let plugin;

  beforeEach(() => {
    plugin = new ExamplePlugin({ name: 'Test Plugin' });
  });

  test('should initialize successfully', () => {
    const result = plugin.init();
    expect(result).toBe(true);
  });

  test('should execute with input', () => {
    plugin.init();
    const input = { test: 'data' };
    const result = plugin.execute(input);

    expect(result.status).toBe('success');
    expect(result.data).toEqual(input);
    expect(result.timestamp).toBeDefined();
  });

  test('should handle disabled state', () => {
    const disabledPlugin = new ExamplePlugin({ enabled: false });
    expect(disabledPlugin.init()).toBe(false);
  });

  test('should throw error when executing while disabled', () => {
    const disabledPlugin = new ExamplePlugin({ enabled: false });
    expect(() => disabledPlugin.execute({})).toThrow();
  });

  test('should shutdown successfully', () => {
    plugin.init();
    const result = plugin.shutdown();
    expect(result).toBe(true);
  });
});

describe('PluginManager', () => {
  const { PluginManager } = require('../plugins/index');
  let manager;

  beforeEach(() => {
    manager = new PluginManager();
  });

  test('should register a plugin', () => {
    manager.register('example', ExamplePlugin);
    expect(manager.get('example')).toBeDefined();
  });

  test('should list registered plugins', () => {
    manager.register('plugin1', ExamplePlugin);
    manager.register('plugin2', ExamplePlugin);
    const list = manager.list();
    expect(list).toContain('plugin1');
    expect(list).toContain('plugin2');
  });

  test('should initialize all plugins', () => {
    manager.register('example', ExamplePlugin);
    manager.initializeAll();
    expect(manager.initialized).toBe(true);
  });
});
