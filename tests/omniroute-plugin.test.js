/**
 * OmniRoute Plugin Tests
 */

const OmniRoutePlugin = require('../plugins/omniroute-plugin');

describe('OmniRoutePlugin', () => {
  let router;

  beforeEach(() => {
    router = new OmniRoutePlugin({ name: 'Test Router' });
  });

  describe('Initialization', () => {
    test('should initialize successfully', () => {
      const result = router.init();
      expect(result).toBe(true);
    });

    test('should handle disabled state', () => {
      const disabledRouter = new OmniRoutePlugin({ enabled: false });
      expect(disabledRouter.init()).toBe(false);
    });
  });

  describe('Route Registration', () => {
    beforeEach(() => router.init());

    test('should register GET route', () => {
      const result = router.get('/users', () => {});
      expect(result.status).toBe('success');
      expect(result.message).toContain('GET /users');
    });

    test('should register POST route', () => {
      const result = router.post('/users', () => {});
      expect(result.status).toBe('success');
      expect(result.message).toContain('POST /users');
    });

    test('should register PUT route', () => {
      const result = router.put('/users/:id', () => {});
      expect(result.status).toBe('success');
      expect(result.message).toContain('PUT /users/:id');
    });

    test('should register DELETE route', () => {
      const result = router.delete('/users/:id', () => {});
      expect(result.status).toBe('success');
      expect(result.message).toContain('DELETE /users/:id');
    });

    test('should register PATCH route', () => {
      const result = router.patch('/users/:id', () => {});
      expect(result.status).toBe('success');
      expect(result.message).toContain('PATCH /users/:id');
    });
  });

  describe('Route Matching', () => {
    beforeEach(() => {
      router.init();
      router.get('/users', () => 'list-users');
      router.get('/users/:id', () => 'get-user');
      router.post('/users', () => 'create-user');
    });

    test('should match exact route', () => {
      const route = router.match('GET', '/users');
      expect(route).toBeDefined();
      expect(route.path).toBe('/users');
      expect(route.method).toBe('GET');
    });

    test('should match parametric route', () => {
      const route = router.match('GET', '/users/123');
      expect(route).toBeDefined();
      expect(route.path).toBe('/users/:id');
    });

    test('should not match non-existent route', () => {
      const route = router.match('GET', '/posts');
      expect(route).toBeNull();
    });

    test('should distinguish between methods', () => {
      const getRoute = router.match('GET', '/users');
      const postRoute = router.match('POST', '/users');

      expect(getRoute).toBeDefined();
      expect(postRoute).toBeDefined();
      expect(getRoute.handler).not.toBe(postRoute.handler);
    });
  });

  describe('Route Management', () => {
    beforeEach(() => {
      router.init();
      router.get('/users', () => {});
      router.post('/users', () => {});
      router.get('/posts', () => {});
    });

    test('should get all routes', () => {
      const routes = router.getRoutes();
      expect(routes.length).toBe(3);
    });

    test('should get routes by method', () => {
      const getRoutes = router.getRoutesByMethod('GET');
      expect(getRoutes.length).toBe(2);
      expect(getRoutes.every(r => r.method === 'GET')).toBe(true);
    });

    test('should remove a route', () => {
      const result = router.removeRoute('GET', '/users');
      expect(result.status).toBe('success');

      const routes = router.getRoutes();
      expect(routes.length).toBe(2);
    });

    test('should clear all routes', () => {
      const result = router.clearRoutes();
      expect(result.status).toBe('success');

      const routes = router.getRoutes();
      expect(routes.length).toBe(0);
    });
  });

  describe('Middleware', () => {
    beforeEach(() => router.init());

    test('should add middleware', () => {
      const middleware = (req, res) => {};
      const result = router.use(middleware);
      expect(result.status).toBe('success');
    });

    test('should reject non-function middleware', () => {
      expect(() => router.use('not-a-function')).toThrow();
    });

    test('should track multiple middleware', () => {
      router.use(() => {});
      router.use(() => {});
      router.use(() => {});
      expect(router.middleware.length).toBe(3);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      router.init();
      router.get('/users', () => {});
      router.get('/users/:id', () => {});
      router.post('/users', () => {});
      router.delete('/posts/:id', () => {});
    });

    test('should return correct statistics', () => {
      const stats = router.stats();
      expect(stats.totalRoutes).toBe(4);
      expect(stats.methods.GET).toBe(2);
      expect(stats.methods.POST).toBe(1);
      expect(stats.methods.DELETE).toBe(1);
    });

    test('should include middleware count', () => {
      router.use(() => {});
      router.use(() => {});
      const stats = router.stats();
      expect(stats.middlewareCount).toBe(2);
    });
  });

  describe('Execute Method', () => {
    beforeEach(() => router.init());

    test('should register route via execute', () => {
      const result = router.execute({
        action: 'register',
        method: 'GET',
        path: '/api/users'
      });
      expect(result.status).toBe('success');
    });

    test('should match route via execute', () => {
      router.get('/api/users', () => {});
      const result = router.execute({
        action: 'match',
        method: 'GET',
        path: '/api/users'
      });
      expect(result.path).toBe('/api/users');
    });

    test('should get all routes via execute', () => {
      router.get('/test', () => {});
      const result = router.execute({ action: 'getRoutes' });
      expect(result.status).toBe('success');
      expect(result.routes.length).toBe(1);
    });

    test('should throw on unknown action', () => {
      expect(() => {
        router.execute({ action: 'unknown' });
      }).toThrow();
    });
  });

  describe('Shutdown', () => {
    beforeEach(() => {
      router.init();
      router.get('/users', () => {});
      router.use(() => {});
    });

    test('should shutdown and clear routes', () => {
      const result = router.shutdown();
      expect(result).toBe(true);
      expect(router.getRoutes().length).toBe(0);
      expect(router.middleware.length).toBe(0);
    });
  });
});
