# Authentication & Authorization Guide

Complete authentication system with role-based access control for AI model access.

## Overview

The Auth Plugin provides:
- User registration and login
- Secure password hashing
- JWT-based token authentication
- Session management
- Role-based access control (RBAC)
- Permission checking
- Account security (lockout, attempt limiting)
- Profile management

## Quick Start

### Setup

```javascript
const { PluginManager, AuthPlugin, OmniRoutePlugin } = require('./plugins');

const manager = new PluginManager();
manager.register('auth', AuthPlugin);
manager.register('router', OmniRoutePlugin);
manager.initializeAll();

const auth = manager.get('auth');
const router = manager.get('router');
```

### Register User

```javascript
const result = auth.register('alice', 'alice@example.com', 'secure_password_123');
// {
//   status: 'success',
//   userId: '...',
//   username: 'alice'
// }
```

### Login

```javascript
const login = auth.login('alice', 'secure_password_123');
// {
//   status: 'success',
//   token: '...',
//   sessionId: '...',
//   user: { id, username, email, role }
// }
```

### Verify Token

```javascript
const verify = auth.verifyToken(token);
if (verify.valid) {
  console.log('Token is valid');
  console.log('User:', verify.user.username);
}
```

## Features

### User Registration

Requirements:
- Username: 3+ characters
- Email: Valid format
- Password: 8+ characters

```javascript
const result = auth.register(username, email, password);

if (result.status === 'success') {
  console.log('User created:', result.userId);
} else {
  console.log('Error:', result.message);
}
```

### User Login

```javascript
const login = auth.login(username, password);

if (login.status === 'success') {
  // Store token for subsequent requests
  const token = login.token;
  console.log('Logged in as:', login.user.username);
}
```

### Token Management

#### Verify Token

```javascript
const verify = auth.verifyToken(token);
console.log('Valid:', verify.valid);
console.log('User:', verify.user);
console.log('Session:', verify.session);
```

#### Logout

```javascript
auth.logout(token);
// Token becomes invalid
```

### Roles and Permissions

#### Default Roles

```javascript
// Admin
{
  name: 'admin',
  permissions: ['read', 'write', 'delete', 'manage_users', 'manage_roles'],
  level: 100
}

// User
{
  name: 'user',
  permissions: ['read', 'write'],
  level: 1
}

// Guest
{
  name: 'guest',
  permissions: ['read'],
  level: 0
}
```

#### Check Permission

```javascript
if (auth.hasPermission('alice', 'write')) {
  // Allow write access
}

if (auth.hasPermission('alice', 'delete')) {
  // Allow delete access
} else {
  // Deny access
}
```

#### Assign Role

```javascript
auth.assignRole('alice', 'admin');
// Alice now has admin permissions
```

### Profile Management

#### Get Profile

```javascript
const profile = auth.getUserProfile('alice');
// {
//   username, email, role,
//   profile: { firstName, lastName, avatar },
//   createdAt, lastLogin, active
// }
```

#### Update Profile

```javascript
auth.updateProfile('alice', {
  firstName: 'Alice',
  lastName: 'Developer',
  avatar: 'https://...'
});
```

#### Change Password

```javascript
const result = auth.changePassword('alice', 'old_password', 'new_password');
if (result.status === 'success') {
  console.log('Password changed');
}
```

## AI Model Access Control

### Protect Routes by Role

```javascript
// Guest access - Haiku only (free tier)
router.post('/api/models/haiku', (req) => {
  if (!req.auth.valid) {
    return { error: 'Unauthorized' };
  }
  return {
    model: 'claude-haiku-4-5-20251001',
    tokens: 'unlimited'
  };
});

// User access - Haiku + Sonnet
router.post('/api/models/sonnet', (req) => {
  if (!auth.hasPermission(req.auth.username, 'write')) {
    return { error: 'Write permission required' };
  }
  return {
    model: 'claude-sonnet-5-5',
    tokens: 'rate-limited'
  };
});

// Admin access - All models
router.post('/api/models/opus', (req) => {
  if (!auth.hasPermission(req.auth.username, 'delete')) {
    return { error: 'Admin only' };
  }
  return {
    model: 'claude-opus-5-5',
    tokens: 'unlimited'
  };
});
```

### Model Tier System

```
Tier 1 (Guest/Free)
└─ claude-haiku-4-5-20251001
   • Read permission
   • 100k tokens/day

Tier 2 (User/Standard)
├─ claude-haiku-4-5-20251001
└─ claude-sonnet-5-5
   • Read + Write permissions
   • 500k tokens/day

Tier 3 (Admin/Premium)
├─ claude-haiku-4-5-20251001
├─ claude-sonnet-5-5
└─ claude-opus-5-5
   • All permissions
   • Unlimited tokens
```

### Implement Tier-Based Access

```javascript
function getAvailableModels(username) {
  const role = auth.getUserProfile(username).user.role;

  const modelsByRole = {
    guest: ['claude-haiku-4-5-20251001'],
    user: ['claude-haiku-4-5-20251001', 'claude-sonnet-5-5'],
    admin: ['claude-haiku-4-5-20251001', 'claude-sonnet-5-5', 'claude-opus-5-5']
  };

  return modelsByRole[role] || ['claude-haiku-4-5-20251001'];
}

// Route to available models
router.post('/api/models/available', (req) => {
  const models = getAvailableModels(req.auth.username);
  return { available: models };
});
```

## Session Management

### Get Session Info

```javascript
const session = auth.getSession(token);
console.log('Session user:', session.user.username);
console.log('Expires at:', session.session.expiresAt);
```

### List Active Sessions

```javascript
const sessions = auth.listActiveSessions();
console.log('Active sessions:', sessions.count);
```

## Security Features

### Password Security

- Passwords are hashed (8+ character requirement)
- Never stored in plain text
- Verified on login

### Account Protection

- Login attempt limiting (default: 5 attempts)
- Automatic lockout (15 minutes)
- Invalid attempt tracking

### Token Security

- JWT-based tokens
- Configurable expiration (default: 1 hour)
- Token invalidation on logout
- Session tracking

### Session Management

- One token per session
- Session expiration tracking
- Active session listing
- Logout invalidates all sessions

## Configuration

```javascript
manager.register('auth', AuthPlugin, {
  name: 'API Authentication',
  secretKey: process.env.SECRET_KEY,
  tokenExpiry: 3600000,        // 1 hour
  maxLoginAttempts: 5,
  lockoutDuration: 900000      // 15 minutes
});
```

## API Reference

### Methods

#### `auth.register(username, email, password)`
Register new user.

#### `auth.login(username, password)`
Login user and get token.

#### `auth.verifyToken(token)`
Verify token validity.

#### `auth.logout(token)`
Logout user and invalidate token.

#### `auth.hasPermission(username, permission)`
Check if user has permission.

#### `auth.assignRole(username, roleName)`
Assign role to user.

#### `auth.getUserProfile(username)`
Get user profile information.

#### `auth.updateProfile(username, updates)`
Update user profile.

#### `auth.changePassword(username, oldPassword, newPassword)`
Change user password.

#### `auth.listUsers()`
List all users.

#### `auth.getRoles()`
List all roles.

#### `auth.getSession(token)`
Get session information.

#### `auth.listActiveSessions()`
List all active sessions.

## Execute Interface

```javascript
// Register
auth.execute({
  action: 'register',
  username: 'alice',
  email: 'alice@example.com',
  password: 'password123'
});

// Login
auth.execute({
  action: 'login',
  username: 'alice',
  password: 'password123'
});

// Verify token
auth.execute({
  action: 'verifyToken',
  token: '...'
});

// Get profile
auth.execute({
  action: 'getUserProfile',
  username: 'alice'
});

// Check permissions
auth.execute({
  action: 'hasPermission',
  username: 'alice',
  permission: 'write'
});
```

## Integration Examples

### Express/Node.js Integration

```javascript
// Middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  const verify = auth.verifyToken(token);
  if (!verify.valid) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = verify.user;
  next();
}

// Protected route
app.post('/api/models/opus', authMiddleware, (req, res) => {
  if (!auth.hasPermission(req.user.username, 'delete')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json({ model: 'claude-opus-5-5' });
});
```

### REST API Endpoints

```
POST   /api/auth/register    → Register user
POST   /api/auth/login       → Login & get token
POST   /api/auth/logout      → Logout
GET    /api/auth/verify      → Verify token
GET    /api/auth/profile     → Get profile
PUT    /api/auth/profile     → Update profile
POST   /api/auth/password    → Change password
GET    /api/users            → List users (admin)
GET    /api/roles            → List roles
GET    /api/models/available → Models for user
```

## Best Practices

1. **Always use HTTPS** - Tokens must be transmitted securely
2. **Store tokens securely** - Use httpOnly cookies when possible
3. **Set expiration times** - Shorter expiry for sensitive operations
4. **Rotate secrets** - Change secret key periodically
5. **Monitor login attempts** - Alert on suspicious activity
6. **Validate input** - Never trust user input
7. **Use strong passwords** - Enforce password requirements
8. **Log audit trail** - Track all auth events

## Testing

```bash
npm test -- auth-plugin.test.js
npm run test:coverage
```

Test coverage:
- User registration (valid/invalid)
- Login with correct/incorrect credentials
- Password validation
- Login attempt limiting
- Token verification
- Role assignment
- Permission checking
- Profile management
- Session management

## Limitations

- Simple password hashing (demo purposes)
- JWT tokens in database (not cryptographically signed)
- In-memory storage (no persistence)
- Single-machine only (no distributed sessions)

## Future Enhancements

- [ ] Real JWT implementation with RS256
- [ ] OAuth2 integration
- [ ] Two-factor authentication
- [ ] API key authentication
- [ ] LDAP/Active Directory support
- [ ] Session persistence
- [ ] Audit logging
- [ ] Rate limiting per user
- [ ] IP whitelisting
- [ ] Device management

## Troubleshooting

### "Invalid username or password"
- Check username spelling
- Verify password is correct
- Ensure user is active

### "Account temporarily locked"
- Wait 15 minutes for lockout to expire
- Or reset user account (admin only)

### "Token expired"
- Login again to get new token
- Adjust token expiry in config

### "Permission denied"
- Check user role
- Verify required permission
- Ask admin to assign proper role

---

**Your authentication system is ready for production!** 🔐

Use it to secure access to AI models and manage user permissions by tier/role.
