/**
 * Demo Script
 * Shows how to use the plugin framework
 */

const { PluginManager, ExamplePlugin } = require('./plugins');
const LoggerPlugin = require('./plugins/logger');
const CachePlugin = require('./plugins/cache');

async function main() {
  console.log('=== Plugin Framework Demo ===\n');

  // Initialize plugin manager
  const manager = new PluginManager();

  // Register plugins
  console.log('1. Registering plugins...\n');
  manager.register('example', ExamplePlugin, { name: 'Example Plugin' });
  manager.register('logger', LoggerPlugin, { name: 'Logger Service', level: 'info' });
  manager.register('cache', CachePlugin, { name: 'Cache Store' });

  // Initialize all plugins
  console.log('\n2. Initializing all plugins...\n');
  manager.initializeAll();

  // Use logger plugin
  console.log('\n3. Testing Logger Plugin...\n');
  const logger = manager.get('logger');
  logger.info('Application started', { version: '1.0.0' });
  logger.debug('Debug mode enabled', { pid: process.pid });
  logger.warn('Resource usage high', { memory: '512MB' });
  logger.error('Connection failed', { host: 'localhost', port: 3000 });

  // Use cache plugin
  console.log('\n4. Testing Cache Plugin...\n');
  const cache = manager.get('cache');

  cache.set('user:1', { id: 1, name: 'Alice', role: 'admin' }, 5000); // 5 second TTL
  cache.set('session:xyz', { token: 'abc123', userId: 1 });

  console.log('Cache size:', cache.size());
  console.log('Get user:1:', cache.get('user:1'));
  console.log('Has user:1:', cache.has('user:1'));
  console.log('Has user:999:', cache.has('user:999'));

  // Use example plugin
  console.log('\n5. Testing Example Plugin...\n');
  const example = manager.get('example');
  const result = example.execute({ data: 'test input' });
  console.log('Execute result:', result);

  // List all plugins
  console.log('\n6. Registered Plugins...\n');
  const plugins = manager.list();
  console.log('Active plugins:', plugins);

  // Show logger logs
  console.log('\n7. All Logged Messages...\n');
  const allLogs = logger.getLogs();
  console.log(`Total logs: ${allLogs.length}`);
  allLogs.forEach((log, index) => {
    console.log(`  ${index + 1}. [${log.level.toUpperCase()}] ${log.message}`);
  });

  // Shutdown
  console.log('\n8. Shutting down all plugins...\n');
  manager.shutdownAll();

  console.log('\n=== Demo Complete ===\n');
}

// Run demo
main().catch(error => {
  console.error('Demo failed:', error.message);
  process.exit(1);
});
