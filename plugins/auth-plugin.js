/**
 * Authentication Plugin
 * Complete authentication, authorization, and session management
 */

class AuthPlugin {
  constructor(config = {}) {
    this.name = config.name || 'AuthPlugin';
    this.version = config.version || '1.0.0';
    this.enabled = config.enabled !== false;
    this.secretKey = config.secretKey || 'your-secret-key-change-in-production';
    this.tokenExpiry = config.tokenExpiry || 3600000; // 1 hour
    this.maxLoginAttempts = config.maxLoginAttempts || 5;
    this.lockoutDuration = config.lockoutDuration || 900000; // 15 minutes

    this.users = new Map();
    this.sessions = new Map();
    this.tokens = new Map();
    this.permissions = new Map();
    this.roles = new Map();
    this.loginAttempts = new Map();
    this.initializeDefaultRoles();
  }

  init() {
    if (!this.enabled) {
      console.log(`${this.name} is disabled`);
      return false;
    }
    console.log(`${this.name} v${this.version} initialized`);
    return true;
  }

  /**
   * Initialize default roles
   */
  initializeDefaultRoles() {
    this.roles.set('admin', {
      name: 'admin',
      permissions: ['read', 'write', 'delete', 'manage_users', 'manage_roles'],
      level: 100
    });

    this.roles.set('user', {
      name: 'user',
      permissions: ['read', 'write'],
      level: 1
    });

    this.roles.set('guest', {
      name: 'guest',
      permissions: ['read'],
      level: 0
    });
  }

  /**
   * Register a new user
   */
  register(username, email, password) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    // Validate input
    if (!username || username.length < 3) {
      return { status: 'error', message: 'Username must be at least 3 characters' };
    }

    if (!email || !this._isValidEmail(email)) {
      return { status: 'error', message: 'Invalid email address' };
    }

    if (!password || password.length < 8) {
      return { status: 'error', message: 'Password must be at least 8 characters' };
    }

    // Check if user exists
    if (this.users.has(username)) {
      return { status: 'error', message: 'Username already exists' };
    }

    // Hash password (simple hash for demo)
    const passwordHash = this._hashPassword(password);

    const user = {
      id: this._generateId(),
      username,
      email,
      passwordHash,
      role: 'user',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      active: true,
      profile: {
        firstName: '',
        lastName: '',
        avatar: null
      }
    };

    this.users.set(username, user);

    return {
      status: 'success',
      message: 'User registered successfully',
      userId: user.id,
      username
    };
  }

  /**
   * Login user
   */
  login(username, password) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    // Check login attempts
    const attempts = this.loginAttempts.get(username) || { count: 0, lockedUntil: null };

    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      return {
        status: 'error',
        message: 'Account temporarily locked due to too many login attempts'
      };
    }

    // Get user
    const user = this.users.get(username);
    if (!user) {
      this._recordLoginAttempt(username, false);
      return { status: 'error', message: 'Invalid username or password' };
    }

    // Check password
    if (!this._verifyPassword(password, user.passwordHash)) {
      this._recordLoginAttempt(username, false);
      return { status: 'error', message: 'Invalid username or password' };
    }

    // Check if active
    if (!user.active) {
      return { status: 'error', message: 'Account is inactive' };
    }

    // Reset login attempts
    this.loginAttempts.delete(username);

    // Generate token
    const token = this._generateToken(user);
    const sessionId = this._generateId();

    // Create session
    const session = {
      id: sessionId,
      userId: user.id,
      username,
      token,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.tokenExpiry).toISOString(),
      active: true
    };

    this.sessions.set(sessionId, session);
    this.tokens.set(token, sessionId);

    // Update last login
    user.lastLogin = new Date().toISOString();

    return {
      status: 'success',
      message: 'Login successful',
      token,
      sessionId,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  }

  /**
   * Verify token
   */
  verifyToken(token) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    const sessionId = this.tokens.get(token);
    if (!sessionId) {
      return { status: 'error', message: 'Invalid token', valid: false };
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      return { status: 'error', message: 'Session not found', valid: false };
    }

    if (!session.active) {
      return { status: 'error', message: 'Session is inactive', valid: false };
    }

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      session.active = false;
      return { status: 'error', message: 'Token expired', valid: false };
    }

    return {
      status: 'success',
      valid: true,
      session,
      user: this.users.get(session.username)
    };
  }

  /**
   * Logout user
   */
  logout(token) {
    const sessionId = this.tokens.get(token);
    if (!sessionId) {
      return { status: 'error', message: 'Invalid token' };
    }

    const session = this.sessions.get(sessionId);
    if (session) {
      session.active = false;
      this.tokens.delete(token);
    }

    return { status: 'success', message: 'Logout successful' };
  }

  /**
   * Check permission
   */
  hasPermission(username, permission) {
    const user = this.users.get(username);
    if (!user) {
      return false;
    }

    const role = this.roles.get(user.role);
    if (!role) {
      return false;
    }

    return role.permissions.includes(permission);
  }

  /**
   * Assign role to user
   */
  assignRole(username, roleName) {
    const user = this.users.get(username);
    if (!user) {
      return { status: 'error', message: 'User not found' };
    }

    const role = this.roles.get(roleName);
    if (!role) {
      return { status: 'error', message: 'Role not found' };
    }

    user.role = roleName;
    return { status: 'success', message: `Role ${roleName} assigned to ${username}` };
  }

  /**
   * Get user profile
   */
  getUserProfile(username) {
    const user = this.users.get(username);
    if (!user) {
      return { status: 'error', message: 'User not found' };
    }

    return {
      status: 'success',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        active: user.active
      }
    };
  }

  /**
   * Update user profile
   */
  updateProfile(username, updates) {
    const user = this.users.get(username);
    if (!user) {
      return { status: 'error', message: 'User not found' };
    }

    if (updates.firstName) user.profile.firstName = updates.firstName;
    if (updates.lastName) user.profile.lastName = updates.lastName;
    if (updates.avatar) user.profile.avatar = updates.avatar;

    return {
      status: 'success',
      message: 'Profile updated',
      user: user.profile
    };
  }

  /**
   * Change password
   */
  changePassword(username, oldPassword, newPassword) {
    const user = this.users.get(username);
    if (!user) {
      return { status: 'error', message: 'User not found' };
    }

    if (!this._verifyPassword(oldPassword, user.passwordHash)) {
      return { status: 'error', message: 'Current password is incorrect' };
    }

    if (newPassword.length < 8) {
      return { status: 'error', message: 'New password must be at least 8 characters' };
    }

    user.passwordHash = this._hashPassword(newPassword);
    return { status: 'success', message: 'Password changed successfully' };
  }

  /**
   * List all users
   */
  listUsers() {
    return {
      status: 'success',
      users: Array.from(this.users.values()).map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        active: u.active,
        createdAt: u.createdAt
      })),
      count: this.users.size
    };
  }

  /**
   * Get all roles
   */
  getRoles() {
    return {
      status: 'success',
      roles: Array.from(this.roles.values()),
      count: this.roles.size
    };
  }

  /**
   * Get session info
   */
  getSession(token) {
    const verify = this.verifyToken(token);
    if (!verify.valid) {
      return verify;
    }

    return {
      status: 'success',
      session: verify.session,
      user: {
        username: verify.user.username,
        email: verify.user.email,
        role: verify.user.role
      }
    };
  }

  /**
   * List active sessions
   */
  listActiveSessions() {
    const active = Array.from(this.sessions.values()).filter(s => s.active);
    return {
      status: 'success',
      sessions: active,
      count: active.length
    };
  }

  /**
   * Execute plugin logic
   */
  execute(input) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    const { action, username, password, email, token, roleName, updates } = input;

    switch (action) {
      case 'register':
        return this.register(username, email, password);
      case 'login':
        return this.login(username, password);
      case 'logout':
        return this.logout(token);
      case 'verifyToken':
        return this.verifyToken(token);
      case 'getUserProfile':
        return this.getUserProfile(username);
      case 'updateProfile':
        return this.updateProfile(username, updates);
      case 'changePassword':
        return this.changePassword(username, input.oldPassword, password);
      case 'assignRole':
        return this.assignRole(username, roleName);
      case 'listUsers':
        return this.listUsers();
      case 'getRoles':
        return this.getRoles();
      case 'getSession':
        return this.getSession(token);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Internal: Generate ID
   */
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Internal: Hash password (simple hash for demo)
   */
  _hashPassword(password) {
    return Buffer.from(password).toString('base64');
  }

  /**
   * Internal: Verify password
   */
  _verifyPassword(password, hash) {
    return this._hashPassword(password) === hash;
  }

  /**
   * Internal: Generate token
   */
  _generateToken(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      iat: Date.now()
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Internal: Validate email
   */
  _isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Internal: Record login attempt
   */
  _recordLoginAttempt(username, success) {
    if (success) {
      this.loginAttempts.delete(username);
      return;
    }

    const attempts = this.loginAttempts.get(username) || { count: 0, lockedUntil: null };
    attempts.count++;

    if (attempts.count >= this.maxLoginAttempts) {
      attempts.lockedUntil = Date.now() + this.lockoutDuration;
    }

    this.loginAttempts.set(username, attempts);
  }

  shutdown() {
    console.log(`${this.name} shutdown (${this.users.size} users, ${this.sessions.size} sessions)`);
    return true;
  }
}

module.exports = AuthPlugin;
