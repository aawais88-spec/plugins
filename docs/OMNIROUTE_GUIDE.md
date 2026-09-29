# OmniRoute Plugin Guide

Advanced routing and request mapping for the plugin framework.

## Overview

The OmniRoute Plugin provides a complete routing system with support for:
- Multiple HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Route pattern matching with parameters
- Middleware support
- Route statistics and monitoring
- Full integration with the plugin framework

## Quick Start

### Basic Setup

```javascript
const { PluginManager, OmniRoutePlugin } = require('./plugins');

const manager = new PluginManager();
manager.register('router', OmniRoutePlugin);
manager.initializeAll();

const router = manager.get('router');
```

### Registering Routes

```javascript
// Simple routes
router.get('/users', handler);
router.post('/users', handler);

// Routes with parameters
router.get('/users/:id', handler);
router.put('/users/:id', handler);
router.delete('/users/:id', handler);

// All HTTP methods
router.get(path, handler);
router.post(path, handler);
router.put(path, handler);
router.delete(path, handler);
router.patch(path, handler);
```

## Features

### Route Registration

Register routes with HTTP methods:

```javascript
router.get('/api/users', (req) => {
  return { action: 'list-users' };
});

router.post('/api/users', (req) => {
  return { action: 'create-user' };
});

router.get('/api/users/:id', (req) => {
  return { action: 'get-user', id: req.params.id };
});
```

### Route Matching

Match incoming requests to registered routes:

```javascript
// Direct match
const route = router.match('GET', '/users');

// Pattern match with parameters
const route = router.match('GET', '/users/123');
// Returns: { method: 'GET', path: '/users/:id', handler: ... }
```

### Middleware

Add middleware functions to process requests:

```javascript
router.use((req, res) => {
  // Pre-request processing
  req.timestamp = Date.now();
});

router.use((req, res) => {
  // Authentication check
  req.authenticated = true;
});
```

### Route Management

List and manage routes:

```javascript
// Get all routes
const allRoutes = router.getRoutes();

// Get routes by method
const getRoutes = router.getRoutesByMethod('GET');

// Remove a route
router.removeRoute('GET', '/users/:id');

// Clear all routes
router.clearRoutes();
```

### Statistics

Get routing statistics:

```javascript
const stats = router.stats();
// Returns:
// {
//   totalRoutes: 8,
//   methods: { GET: 4, POST: 2, PUT: 1, DELETE: 1 },
//   middlewareCount: 0,
//   enabled: true
// }
```

## API Reference

### Methods

#### `router.get(path, handler)`
Register a GET route.

#### `router.post(path, handler)`
Register a POST route.

#### `router.put(path, handler)`
Register a PUT route.

#### `router.delete(path, handler)`
Register a DELETE route.

#### `router.patch(path, handler)`
Register a PATCH route.

#### `router.route(method, path, handler)`
Generic route registration.

```javascript
router.route('OPTIONS', '/api', handler);
```

#### `router.match(method, path)`
Match a request to a registered route.

Returns route object or null.

```javascript
const route = router.match('GET', '/users/123');
if (route) {
  console.log(`Matched: ${route.method} ${route.path}`);
}
```

#### `router.use(middleware)`
Add middleware function.

```javascript
router.use((req, res) => {
  req.user = getUserFromToken(req.headers.auth);
});
```

#### `router.getRoutes()`
Get all registered routes.

Returns array of route objects.

#### `router.getRoutesByMethod(method)`
Get routes for a specific HTTP method.

```javascript
const postRoutes = router.getRoutesByMethod('POST');
```

#### `router.removeRoute(method, path)`
Remove a specific route.

#### `router.clearRoutes()`
Clear all routes.

#### `router.stats()`
Get routing statistics.

#### `router.init()`
Initialize the plugin.

#### `router.shutdown()`
Cleanup and shutdown.

## Pattern Matching

Routes support parameter patterns:

```javascript
// Pattern: /users/:id matches:
// - /users/123
// - /users/abc
// - /users/any-value

// Pattern: /posts/:id/comments/:commentId matches:
// - /posts/1/comments/42
// - /posts/abc/comments/xyz

router.get('/posts/:id/comments/:commentId', handler);
```

## Execute Interface

Use the plugin execute method for programmatic access:

```javascript
// Register route
router.execute({
  action: 'register',
  method: 'GET',
  path: '/api/status'
});

// Match route
const result = router.execute({
  action: 'match',
  method: 'GET',
  path: '/api/status'
});

// Get all routes
const result = router.execute({
  action: 'getRoutes'
});

// Get routes by method
const result = router.execute({
  action: 'getByMethod',
  method: 'POST'
});

// Clear routes
router.execute({ action: 'clear' });

// Remove route
router.execute({
  action: 'remove',
  method: 'GET',
  path: '/api/users'
});
```

## Configuration

Configure the plugin at initialization:

```javascript
manager.register('router', OmniRoutePlugin, {
  name: 'API Router',
  basePrefix: '/api',
  caseSensitive: true
});
```

### Config Options

- **name** - Plugin name (default: 'OmniRoutePlugin')
- **basePrefix** - URL prefix for all routes (default: '')
- **caseSensitive** - Case-sensitive route matching (default: true)

## Example: REST API

```javascript
const manager = new PluginManager();
manager.register('router', OmniRoutePlugin);
manager.initializeAll();

const router = manager.get('router');

// Users endpoints
router.get('/api/users', listUsers);
router.post('/api/users', createUser);
router.get('/api/users/:id', getUser);
router.put('/api/users/:id', updateUser);
router.delete('/api/users/:id', deleteUser);

// Posts endpoints
router.get('/api/posts', listPosts);
router.post('/api/posts', createPost);
router.get('/api/posts/:id', getPost);
router.put('/api/posts/:id', updatePost);
router.delete('/api/posts/:id', deletePost);

// Middleware
router.use(authMiddleware);
router.use(loggingMiddleware);

// Handle request
function handleRequest(method, path) {
  const route = router.match(method, path);
  if (route) {
    return route.handler({ method, path });
  }
  return { status: 404, message: 'Not Found' };
}

// Test
console.log(handleRequest('GET', '/api/users'));        // ✅ Match
console.log(handleRequest('GET', '/api/users/123'));    // ✅ Match
console.log(handleRequest('POST', '/api/users'));       // ✅ Match
console.log(handleRequest('GET', '/invalid'));          // ❌ No match
```

## Testing

Run the included tests:

```bash
npm test

# Specific test file
npm test -- omniroute-plugin.test.js

# With coverage
npm run test:coverage
```

The plugin includes 25 comprehensive tests covering:
- Route registration
- Route matching
- Parameter handling
- Middleware management
- Statistics
- Error handling

## Integration

The OmniRoute plugin integrates seamlessly with other plugins:

```javascript
const { PluginManager, LoggerPlugin, OmniRoutePlugin } = require('./plugins');

const manager = new PluginManager();
manager.register('logger', LoggerPlugin);
manager.register('router', OmniRoutePlugin);
manager.initializeAll();

const logger = manager.get('logger');
const router = manager.get('router');

// Use together
router.use((req, res) => {
  logger.info('Request received', { method: req.method, path: req.path });
});

router.get('/api/users', (req) => {
  logger.info('Listing users');
  return { users: [] };
});
```

## Performance

- Fast route matching (O(1) for exact matches, O(n) for patterns)
- Efficient middleware processing
- Low memory overhead
- Suitable for high-traffic applications

## Limitations

- Single-threaded routing
- In-memory route storage (no persistence)
- No automatic route optimization
- Pattern matching limited to `:paramName` syntax

## Future Enhancements

- [ ] Route groups with prefixes
- [ ] Route middleware per route
- [ ] Regex pattern support
- [ ] Route priority/ordering
- [ ] Built-in validation
- [ ] Rate limiting
- [ ] Caching integration
