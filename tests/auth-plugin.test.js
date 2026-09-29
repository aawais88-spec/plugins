/**
 * Auth Plugin Tests
 */

const AuthPlugin = require('../plugins/auth-plugin');

describe('AuthPlugin', () => {
  let auth;

  beforeEach(() => {
    auth = new AuthPlugin({ name: 'Test Auth' });
  });

  describe('Initialization', () => {
    test('should initialize successfully', () => {
      const result = auth.init();
      expect(result).toBe(true);
    });

    test('should initialize default roles', () => {
      auth.init();
      const roles = auth.getRoles();
      expect(roles.count).toBe(3);
      expect(roles.roles.map(r => r.name)).toContain('admin');
      expect(roles.roles.map(r => r.name)).toContain('user');
      expect(roles.roles.map(r => r.name)).toContain('guest');
    });
  });

  describe('User Registration', () => {
    beforeEach(() => auth.init());

    test('should register new user', () => {
      const result = auth.register('testuser', 'test@example.com', 'password123');
      expect(result.status).toBe('success');
      expect(result.userId).toBeDefined();
    });

    test('should reject invalid username', () => {
      const result = auth.register('ab', 'test@example.com', 'password123');
      expect(result.status).toBe('error');
      expect(result.message).toContain('at least 3 characters');
    });

    test('should reject invalid email', () => {
      const result = auth.register('testuser', 'invalid-email', 'password123');
      expect(result.status).toBe('error');
      expect(result.message).toContain('Invalid email');
    });

    test('should reject weak password', () => {
      const result = auth.register('testuser', 'test@example.com', 'short');
      expect(result.status).toBe('error');
      expect(result.message).toContain('at least 8 characters');
    });

    test('should reject duplicate username', () => {
      auth.register('testuser', 'test1@example.com', 'password123');
      const result = auth.register('testuser', 'test2@example.com', 'password123');
      expect(result.status).toBe('error');
      expect(result.message).toContain('already exists');
    });
  });

  describe('User Login', () => {
    beforeEach(() => {
      auth.init();
      auth.register('testuser', 'test@example.com', 'password123');
    });

    test('should login with correct credentials', () => {
      const result = auth.login('testuser', 'password123');
      expect(result.status).toBe('success');
      expect(result.token).toBeDefined();
      expect(result.sessionId).toBeDefined();
    });

    test('should reject invalid username', () => {
      const result = auth.login('wronguser', 'password123');
      expect(result.status).toBe('error');
      expect(result.message).toContain('Invalid');
    });

    test('should reject invalid password', () => {
      const result = auth.login('testuser', 'wrongpassword');
      expect(result.status).toBe('error');
      expect(result.message).toContain('Invalid');
    });

    test('should track login attempts', () => {
      for (let i = 0; i < 5; i++) {
        auth.login('testuser', 'wrongpassword');
      }
      const result = auth.login('testuser', 'password123');
      expect(result.status).toBe('error');
      expect(result.message).toContain('temporarily locked');
    });

    test('should update last login', () => {
      auth.login('testuser', 'password123');
      const profile = auth.getUserProfile('testuser');
      expect(profile.user.lastLogin).toBeDefined();
    });
  });

  describe('Token Management', () => {
    let token;

    beforeEach(() => {
      auth.init();
      auth.register('testuser', 'test@example.com', 'password123');
      const login = auth.login('testuser', 'password123');
      token = login.token;
    });

    test('should verify valid token', () => {
      const result = auth.verifyToken(token);
      expect(result.valid).toBe(true);
      expect(result.session).toBeDefined();
    });

    test('should reject invalid token', () => {
      const result = auth.verifyToken('invalid-token');
      expect(result.valid).toBe(false);
    });

    test('should logout and invalidate token', () => {
      auth.logout(token);
      const result = auth.verifyToken(token);
      expect(result.valid).toBe(false);
    });
  });

  describe('Roles and Permissions', () => {
    beforeEach(() => {
      auth.init();
      auth.register('testuser', 'test@example.com', 'password123');
    });

    test('should have default user role', () => {
      const profile = auth.getUserProfile('testuser');
      expect(profile.user.role).toBe('user');
    });

    test('should check permission for role', () => {
      const hasRead = auth.hasPermission('testuser', 'read');
      expect(hasRead).toBe(true);

      const hasDelete = auth.hasPermission('testuser', 'delete');
      expect(hasDelete).toBe(false);
    });

    test('should assign role to user', () => {
      const result = auth.assignRole('testuser', 'admin');
      expect(result.status).toBe('success');

      const hasDelete = auth.hasPermission('testuser', 'delete');
      expect(hasDelete).toBe(true);
    });

    test('should reject invalid role', () => {
      const result = auth.assignRole('testuser', 'invalid-role');
      expect(result.status).toBe('error');
    });
  });

  describe('User Profile', () => {
    beforeEach(() => {
      auth.init();
      auth.register('testuser', 'test@example.com', 'password123');
    });

    test('should get user profile', () => {
      const result = auth.getUserProfile('testuser');
      expect(result.status).toBe('success');
      expect(result.user.username).toBe('testuser');
      expect(result.user.email).toBe('test@example.com');
    });

    test('should update user profile', () => {
      const result = auth.updateProfile('testuser', {
        firstName: 'John',
        lastName: 'Doe'
      });
      expect(result.status).toBe('success');

      const profile = auth.getUserProfile('testuser');
      expect(profile.user.profile.firstName).toBe('John');
      expect(profile.user.profile.lastName).toBe('Doe');
    });

    test('should change password', () => {
      const result = auth.changePassword('testuser', 'password123', 'newpassword456');
      expect(result.status).toBe('success');

      // Old password should not work
      const loginOld = auth.login('testuser', 'password123');
      expect(loginOld.status).toBe('error');

      // New password should work
      const loginNew = auth.login('testuser', 'newpassword456');
      expect(loginNew.status).toBe('success');
    });

    test('should reject wrong current password', () => {
      const result = auth.changePassword('testuser', 'wrongpassword', 'newpassword456');
      expect(result.status).toBe('error');
    });
  });

  describe('User Management', () => {
    beforeEach(() => {
      auth.init();
      auth.register('user1', 'user1@example.com', 'password123');
      auth.register('user2', 'user2@example.com', 'password123');
      auth.register('user3', 'user3@example.com', 'password123');
    });

    test('should list all users', () => {
      const result = auth.listUsers();
      expect(result.status).toBe('success');
      expect(result.count).toBe(3);
      expect(result.users.length).toBe(3);
    });

    test('should list active sessions', () => {
      auth.login('user1', 'password123');
      auth.login('user2', 'password123');

      const result = auth.listActiveSessions();
      expect(result.status).toBe('success');
      expect(result.count).toBe(2);
    });
  });

  describe('Session Management', () => {
    let token;

    beforeEach(() => {
      auth.init();
      auth.register('testuser', 'test@example.com', 'password123');
      const login = auth.login('testuser', 'password123');
      token = login.token;
    });

    test('should get session info', () => {
      const result = auth.getSession(token);
      expect(result.status).toBe('success');
      expect(result.session.username).toBe('testuser');
      expect(result.user.role).toBe('user');
    });

    test('should reject invalid token for session', () => {
      const result = auth.getSession('invalid-token');
      expect(result.status).toBe('error');
    });
  });

  describe('Execute Method', () => {
    beforeEach(() => auth.init());

    test('should register via execute', () => {
      const result = auth.execute({
        action: 'register',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
      expect(result.status).toBe('success');
    });

    test('should login via execute', () => {
      auth.register('testuser', 'test@example.com', 'password123');
      const result = auth.execute({
        action: 'login',
        username: 'testuser',
        password: 'password123'
      });
      expect(result.status).toBe('success');
    });

    test('should throw on unknown action', () => {
      expect(() => {
        auth.execute({ action: 'unknown' });
      }).toThrow();
    });
  });

  describe('Shutdown', () => {
    beforeEach(() => {
      auth.init();
      auth.register('user1', 'user1@example.com', 'password123');
      auth.register('user2', 'user2@example.com', 'password123');
      auth.login('user1', 'password123');
    });

    test('should shutdown and report stats', () => {
      const result = auth.shutdown();
      expect(result).toBe(true);
    });
  });
});
