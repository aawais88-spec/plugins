/**
 * OmniRoute Plugin Demo
 * Shows routing capabilities integrated with the plugin framework
 */

const { PluginManager, OmniRoutePlugin } = require('./plugins');

async function main() {
  console.log('=== OmniRoute Plugin Demo ===\n');

  // Initialize plugin manager
  const manager = new PluginManager();

  // Register omniroute plugin
  console.log('1. Registering OmniRoute Plugin...\n');
  manager.register('router', OmniRoutePlugin, {
    name: 'API Router',
    basePrefix: '/api'
  });

  // Initialize
  console.log('2. Initializing plugin...\n');
  manager.initializeAll();

  // Get router
  const router = manager.get('router');

  // Register API routes
  console.log('3. Registering API Routes...\n');
  router.get('/users', () => ({ action: 'list-users' }));
  router.post('/users', () => ({ action: 'create-user' }));
  router.get('/users/:id', () => ({ action: 'get-user' }));
  router.put('/users/:id', () => ({ action: 'update-user' }));
  router.delete('/users/:id', () => ({ action: 'delete-user' }));

  router.get('/posts', () => ({ action: 'list-posts' }));
  router.post('/posts', () => ({ action: 'create-post' }));
  router.get('/posts/:id', () => ({ action: 'get-post' }));

  console.log('✅ Routes registered\n');

  // Show all routes
  console.log('4. All Registered Routes:\n');
  const allRoutes = router.getRoutes();
  allRoutes.forEach((route, index) => {
    console.log(`  ${index + 1}. ${route.method.padEnd(7)} ${route.path}`);
  });

  // Test route matching
  console.log('\n5. Route Matching Tests:\n');

  const testCases = [
    { method: 'GET', path: '/users', expected: 'list-users' },
    { method: 'GET', path: '/users/123', expected: 'get-user' },
    { method: 'POST', path: '/users', expected: 'create-user' },
    { method: 'PUT', path: '/users/456', expected: 'update-user' },
    { method: 'DELETE', path: '/users/789', expected: 'delete-user' },
    { method: 'GET', path: '/posts', expected: 'list-posts' },
    { method: 'GET', path: '/posts/abc', expected: 'get-post' },
    { method: 'GET', path: '/invalid', expected: 'NOT FOUND' }
  ];

  testCases.forEach(testCase => {
    const matched = router.match(testCase.method, testCase.path);
    const result = matched ? '✅' : '❌';
    const status = matched ? 'FOUND' : 'NOT FOUND';
    console.log(`  ${result} ${testCase.method.padEnd(7)} ${testCase.path.padEnd(15)} → ${status}`);
  });

  // Show routes by method
  console.log('\n6. Routes by HTTP Method:\n');
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  methods.forEach(method => {
    const routes = router.getRoutesByMethod(method);
    console.log(`  ${method}: ${routes.length} route(s)`);
    routes.forEach(route => {
      console.log(`    - ${route.path}`);
    });
  });

  // Show statistics
  console.log('\n7. Router Statistics:\n');
  const stats = router.stats();
  console.log(`  Total Routes: ${stats.totalRoutes}`);
  console.log(`  Methods Used:`, Object.entries(stats.methods)
    .map(([method, count]) => `${method}(${count})`)
    .join(', '));
  console.log(`  Middleware: ${stats.middlewareCount}`);

  // Test execute method
  console.log('\n8. Execute via Plugin Interface:\n');

  const registerResult = router.execute({
    action: 'register',
    method: 'PATCH',
    path: '/users/:id/status'
  });
  console.log(`  Register: ${registerResult.message}`);

  const matchResult = router.execute({
    action: 'match',
    method: 'GET',
    path: '/posts/42'
  });
  console.log(`  Match GET /posts/42: ${matchResult.path ? '✅ Found' : '❌ Not Found'}`);

  const routesResult = router.execute({
    action: 'getRoutes'
  });
  console.log(`  Get All Routes: ${routesResult.routes.length} routes`);

  // Shutdown
  console.log('\n9. Shutting down...\n');
  manager.shutdownAll();

  console.log('\n=== OmniRoute Demo Complete ===\n');
}

// Run demo
main().catch(error => {
  console.error('Demo failed:', error.message);
  process.exit(1);
});
