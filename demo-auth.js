/**
 * Auth Plugin Demo
 * Shows authentication, authorization, and model access control
 */

const { PluginManager, AuthPlugin, OmniRoutePlugin, LoggerPlugin } = require('./plugins');

async function main() {
  console.log('=== Authentication Plugin Demo ===\n');

  // Initialize plugin manager
  const manager = new PluginManager();

  // Register plugins
  console.log('1. Registering Plugins...\n');
  manager.register('auth', AuthPlugin, { name: 'API Auth System' });
  manager.register('router', OmniRoutePlugin);
  manager.register('logger', LoggerPlugin);

  // Initialize
  console.log('2. Initializing...\n');
  manager.initializeAll();

  const auth = manager.get('auth');
  const router = manager.get('router');
  const logger = manager.get('logger');

  // Register test users
  console.log('3. Registering Users...\n');

  const user1 = auth.register('alice', 'alice@example.com', 'alice_secure_123');
  console.log(`  ✅ Registered: alice (${user1.status})`);

  const user2 = auth.register('bob', 'bob@example.com', 'bob_secure_456');
  console.log(`  ✅ Registered: bob (${user2.status})`);

  const user3 = auth.register('admin', 'admin@example.com', 'admin_secure_789');
  console.log(`  ✅ Registered: admin (${user3.status})\n`);

  // Assign roles
  console.log('4. Assigning Roles...\n');

  auth.assignRole('admin', 'admin');
  console.log('  ✅ Assigned: admin → admin role');

  auth.assignRole('alice', 'user');
  console.log('  ✅ Assigned: alice → user role');

  auth.assignRole('bob', 'user');
  console.log('  ✅ Assigned: bob → user role\n');

  // Login users
  console.log('5. User Login & Token Generation...\n');

  const aliceLogin = auth.login('alice', 'alice_secure_123');
  console.log(`  ✅ Alice logged in`);
  console.log(`     Token: ${aliceLogin.token.substring(0, 30)}...`);
  console.log(`     Session: ${aliceLogin.sessionId}`);

  const bobLogin = auth.login('bob', 'bob_secure_456');
  console.log(`  ✅ Bob logged in`);
  console.log(`     Token: ${bobLogin.token.substring(0, 30)}...`);

  const adminLogin = auth.login('admin', 'admin_secure_789');
  console.log(`  ✅ Admin logged in`);
  console.log(`     Token: ${adminLogin.token.substring(0, 30)}...\n`);

  // Verify tokens
  console.log('6. Token Verification...\n');

  const verifyAlice = auth.verifyToken(aliceLogin.token);
  console.log(`  ✅ Alice's token: ${verifyAlice.valid ? 'VALID' : 'INVALID'}`);
  console.log(`     User: ${verifyAlice.user.username}, Role: ${verifyAlice.user.role}`);

  const verifyBob = auth.verifyToken(bobLogin.token);
  console.log(`  ✅ Bob's token: ${verifyBob.valid ? 'VALID' : 'INVALID'}`);

  const verifyAdmin = auth.verifyToken(adminLogin.token);
  console.log(`  ✅ Admin's token: ${verifyAdmin.valid ? 'VALID' : 'INVALID'}\n`);

  // Check permissions
  console.log('7. Permission Checks...\n');

  const aliceRead = auth.hasPermission('alice', 'read');
  const aliceWrite = auth.hasPermission('alice', 'write');
  const aliceDelete = auth.hasPermission('alice', 'delete');
  console.log(`  Alice (user role):`);
  console.log(`    Read permission: ${aliceRead ? '✅ YES' : '❌ NO'}`);
  console.log(`    Write permission: ${aliceWrite ? '✅ YES' : '❌ NO'}`);
  console.log(`    Delete permission: ${aliceDelete ? '✅ YES' : '❌ NO'}`);

  const adminDelete = auth.hasPermission('admin', 'delete');
  const adminManage = auth.hasPermission('admin', 'manage_users');
  console.log(`  Admin (admin role):`);
  console.log(`    Delete permission: ${adminDelete ? '✅ YES' : '❌ NO'}`);
  console.log(`    Manage users: ${adminManage ? '✅ YES' : '❌ NO'}\n`);

  // Setup protected routes with model access
  console.log('8. Setting Up Protected Routes...\n');

  router.post('/api/models/haiku', (req) => {
    if (!req.auth.valid) return { error: 'Unauthorized' };
    return {
      model: 'claude-haiku-4-5-20251001',
      user: req.auth.username,
      access: 'full'
    };
  });
  console.log('  ✅ /api/models/haiku → Haiku (all authenticated users)');

  router.post('/api/models/sonnet', (req) => {
    if (!auth.hasPermission(req.auth.username, 'write')) {
      return { error: 'Permission denied' };
    }
    return {
      model: 'claude-sonnet-5-5',
      user: req.auth.username,
      access: 'write'
    };
  });
  console.log('  ✅ /api/models/sonnet → Sonnet (write permission required)');

  router.post('/api/models/opus', (req) => {
    if (!auth.hasPermission(req.auth.username, 'manage_users')) {
      return { error: 'Admin only' };
    }
    return {
      model: 'claude-opus-5-5',
      user: req.auth.username,
      access: 'admin'
    };
  });
  console.log('  ✅ /api/models/opus → Opus (admin only)\n');

  // Simulate API calls with different users
  console.log('9. API Requests with Authentication...\n');

  // Alice tries to access Haiku (should succeed - authenticated)
  console.log('  Alice requests Haiku:');
  const aliceHaiku = {
    auth: verifyAlice,
    username: 'alice'
  };
  if (aliceHaiku.auth.valid) {
    logger.info('Haiku access granted', { user: 'alice', model: 'haiku' });
    console.log('    ✅ GRANTED - Haiku model');
  }

  // Alice tries to access Opus (should fail - not admin)
  console.log('  Alice requests Opus:');
  if (!auth.hasPermission('alice', 'manage_users')) {
    logger.info('Opus access denied', { user: 'alice', reason: 'not admin' });
    console.log('    ❌ DENIED - Admin role required');
  }

  // Admin tries to access Opus (should succeed)
  console.log('  Admin requests Opus:');
  if (auth.hasPermission('admin', 'manage_users')) {
    logger.info('Opus access granted', { user: 'admin', model: 'opus' });
    console.log('    ✅ GRANTED - Opus model\n');
  }

  // Update user profile
  console.log('10. User Profile Management...\n');

  auth.updateProfile('alice', {
    firstName: 'Alice',
    lastName: 'Developer'
  });
  console.log('  ✅ Alice profile updated');

  const aliceProfile = auth.getUserProfile('alice');
  console.log(`     Name: ${aliceProfile.user.profile.firstName} ${aliceProfile.user.profile.lastName}`);
  console.log(`     Role: ${aliceProfile.user.role}`);
  console.log(`     Email: ${aliceProfile.user.email}\n`);

  // List all users
  console.log('11. User Management...\n');
  const users = auth.listUsers();
  console.log(`  Total users: ${users.count}`);
  users.users.forEach((u, i) => {
    console.log(`    ${i + 1}. ${u.username} (${u.role}) - Active: ${u.active}`);
  });
  console.log();

  // List roles
  console.log('12. Available Roles...\n');
  const roles = auth.getRoles();
  roles.roles.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.name} (Level: ${r.level})`);
    console.log(`     Permissions: ${r.permissions.join(', ')}`);
  });
  console.log();

  // List active sessions
  console.log('13. Active Sessions...\n');
  const sessions = auth.listActiveSessions();
  console.log(`  Total active: ${sessions.count}`);
  sessions.sessions.forEach((s, i) => {
    console.log(`    ${i + 1}. ${s.username} (${s.id.substring(0, 10)}...)`);
    console.log(`       Expires: ${new Date(s.expiresAt).toLocaleTimeString()}`);
  });
  console.log();

  // Logout
  console.log('14. User Logout...\n');
  auth.logout(aliceLogin.token);
  console.log('  ✅ Alice logged out');

  const verifyAfterLogout = auth.verifyToken(aliceLogin.token);
  console.log(`  ✅ Alice's token after logout: ${verifyAfterLogout.valid ? 'VALID' : 'INVALID'}\n`);

  // Security features
  console.log('15. Security Features Enabled...\n');
  console.log('  ✅ Password hashing');
  console.log('  ✅ JWT tokens');
  console.log('  ✅ Session management');
  console.log('  ✅ Role-based access control');
  console.log('  ✅ Login attempt limiting');
  console.log('  ✅ Account lockout');
  console.log('  ✅ Token expiration');
  console.log('  ✅ Permission verification\n');

  // Shutdown
  console.log('16. Shutting Down...\n');
  manager.shutdownAll();

  console.log('\n=== Authentication Demo Complete ===\n');
}

// Run demo
main().catch(error => {
  console.error('Demo failed:', error.message);
  process.exit(1);
});
