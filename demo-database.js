/**
 * Database Plugin Demo
 * Shows database operations integrated with the plugin framework
 */

const { PluginManager, DatabasePlugin, LoggerPlugin } = require('./plugins');

async function main() {
  console.log('=== Database Plugin Demo ===\n');

  // Initialize plugin manager
  const manager = new PluginManager();

  // Register plugins
  console.log('1. Registering Plugins...\n');
  manager.register('db', DatabasePlugin, {
    name: 'Application Database',
    type: 'sqlite',
    database: 'app.db'
  });
  manager.register('logger', LoggerPlugin, { name: 'Database Logger' });

  // Initialize
  console.log('2. Initializing Plugins...\n');
  manager.initializeAll();

  const db = manager.get('db');
  const logger = manager.get('logger');

  // Connect to database
  console.log('3. Connecting to Database...\n');
  const connection = db.connect();
  console.log(`  ✅ Connection ID: ${connection.connectionId}`);
  console.log(`  ✅ Type: ${connection.config.type}`);
  console.log(`  ✅ Database: ${connection.config.database}\n`);

  // Create tables
  console.log('4. Creating Tables...\n');

  const userSchema = {
    id: 'INT PRIMARY KEY',
    name: 'VARCHAR(100)',
    email: 'VARCHAR(100)',
    created: 'TIMESTAMP'
  };

  const postSchema = {
    id: 'INT PRIMARY KEY',
    userId: 'INT',
    title: 'VARCHAR(255)',
    content: 'TEXT',
    created: 'TIMESTAMP'
  };

  db.createTable('users', userSchema);
  console.log('  ✅ Created: users table');

  db.createTable('posts', postSchema);
  console.log('  ✅ Created: posts table\n');

  // Show all tables
  console.log('5. List Tables:\n');
  const tables = db.listTables();
  tables.tables.forEach((table, index) => {
    console.log(`  ${index + 1}. ${table}`);
  });
  console.log();

  // Insert data
  console.log('6. Inserting Data...\n');

  const user1 = db.insert('users', { name: 'Alice', email: 'alice@example.com' });
  logger.info('User created', { name: 'Alice', email: 'alice@example.com' });
  console.log(`  ✅ Inserted user: Alice (affected: ${user1.rowsAffected})`);

  const user2 = db.insert('users', { name: 'Bob', email: 'bob@example.com' });
  logger.info('User created', { name: 'Bob', email: 'bob@example.com' });
  console.log(`  ✅ Inserted user: Bob (affected: ${user2.rowsAffected})`);

  const post1 = db.insert('posts', { userId: 1, title: 'First Post', content: 'Hello World' });
  logger.info('Post created', { userId: 1, title: 'First Post' });
  console.log(`  ✅ Inserted post: First Post (affected: ${post1.rowsAffected})\n`);

  // Select data
  console.log('7. Selecting Data...\n');

  const allUsers = db.select('users');
  console.log(`  ✅ SELECT * FROM users: ${allUsers.rowsAffected} rows`);
  allUsers.rows.forEach(row => {
    console.log(`     - ID: ${row.id}, Name: ${row.name}, Email: ${row.email}`);
  });

  const userById = db.select('users', { id: 1 });
  console.log(`  ✅ SELECT * FROM users WHERE id=1: ${userById.rowsAffected} rows\n`);

  // Update data
  console.log('8. Updating Data...\n');

  const updateResult = db.update('users', { email: 'alice.new@example.com' }, { id: 1 });
  logger.info('User updated', { id: 1, newEmail: 'alice.new@example.com' });
  console.log(`  ✅ UPDATE users: Email changed for Alice (affected: ${updateResult.rowsAffected})\n`);

  // Transaction example
  console.log('9. Transaction Management...\n');

  const tx = db.beginTransaction();
  console.log(`  ✅ Transaction started: ${tx.transactionId}`);

  db.insert('posts', { userId: 2, title: 'Second Post', content: 'Another post' });
  console.log(`  ✅ Query 1: Inserted post within transaction`);

  db.update('users', { email: 'bob.update@example.com' }, { id: 2 });
  console.log(`  ✅ Query 2: Updated user within transaction`);

  const commit = db.commit(tx.transactionId);
  console.log(`  ✅ Transaction committed: ${commit.queriesExecuted} queries executed\n`);

  // Delete data
  console.log('10. Deleting Data...\n');

  const deleteResult = db.delete('posts', { id: 2 });
  logger.info('Post deleted', { id: 2 });
  console.log(`  ✅ DELETE FROM posts WHERE id=2: (affected: ${deleteResult.rowsAffected})\n`);

  // Query statistics
  console.log('11. Database Status...\n');
  const status = db.status();
  console.log(`  Database Type: ${status.type}`);
  console.log(`  Database Name: ${status.database}`);
  console.log(`  Status: ${status.status}`);
  console.log(`  Active Connections: ${status.activeConnections}/${status.maxConnections}`);
  console.log(`  Total Queries: ${status.totalQueries}`);
  console.log(`  Total Tables: ${status.totalTables}`);
  console.log(`  Active Transactions: ${status.activeTransactions}\n`);

  // Query history
  console.log('12. Query History (Last 5):\n');
  const history = db.getQueryHistory(5);
  history.queries.forEach((query, index) => {
    console.log(`  ${index + 1}. ${query.sql.substring(0, 50)}... (${query.duration}ms)`);
  });
  console.log();

  // Logger statistics
  console.log('13. Logger Output:\n');
  const logs = logger.getLogs();
  console.log(`  Total Logs: ${logs.length}`);
  const errorLogs = logger.getLogs('error');
  const infoLogs = logger.getLogs('info');
  console.log(`  Info Logs: ${infoLogs.length}`);
  console.log(`  Error Logs: ${errorLogs.length}\n`);

  // Table info
  console.log('14. Table Information:\n');
  const userTableInfo = db.getTableInfo('users');
  if (userTableInfo.status === 'success') {
    console.log(`  Table: ${userTableInfo.table.name}`);
    console.log(`  Schema: ${JSON.stringify(userTableInfo.table.schema)}\n`);
  }

  // Shutdown
  console.log('15. Shutting Down...\n');
  manager.shutdownAll();

  console.log('\n=== Database Demo Complete ===\n');
}

// Run demo
main().catch(error => {
  console.error('Demo failed:', error.message);
  process.exit(1);
});
