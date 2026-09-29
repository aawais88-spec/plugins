# Database Plugin Guide

Complete database management for the plugin framework with connection pooling, transactions, and CRUD operations.

## Overview

The Database Plugin provides:
- Connection management & pooling
- CRUD operations (Create, Read, Update, Delete)
- Transaction support with commit/rollback
- Table schema management
- Query history tracking
- Performance monitoring
- Multiple database support (SQLite, PostgreSQL, MySQL)

## Quick Start

### Basic Setup

```javascript
const { PluginManager, DatabasePlugin } = require('./plugins');

const manager = new PluginManager();
manager.register('db', DatabasePlugin, {
  type: 'sqlite',
  database: 'app.db'
});
manager.initializeAll();

const db = manager.get('db');
```

### Connect to Database

```javascript
const connection = db.connect();
// { status: 'success', connectionId: '...' }
```

## Features

### Connection Management

#### Connect

```javascript
const connection = db.connect({
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  username: 'user',
  password: 'pass'
});
```

#### Disconnect

```javascript
db.disconnect(connectionId);
```

#### Check Status

```javascript
const status = db.status();
// {
//   status: 'connected',
//   type: 'sqlite',
//   database: 'app.db',
//   activeConnections: 1,
//   maxConnections: 10,
//   totalQueries: 42,
//   totalTables: 5,
//   activeTransactions: 0
// }
```

### Raw Queries

Execute custom SQL:

```javascript
// Basic query
const result = db.query('SELECT * FROM users');

// Query with parameters
const result = db.query(
  'SELECT * FROM users WHERE id = ?',
  [1]
);

// Specific connection
const result = db.query(sql, params, connectionId);
```

### CRUD Operations

#### Insert

```javascript
const result = db.insert('users', {
  name: 'Alice',
  email: 'alice@example.com',
  role: 'admin'
});

// Result:
// {
//   status: 'success',
//   sql: 'INSERT INTO users (...)',
//   rowsAffected: 1,
//   duration: 12
// }
```

#### Select

```javascript
// Get all rows
const allUsers = db.select('users');

// With WHERE clause
const activeUsers = db.select('users', {
  status: 'active'
});

// Multiple conditions
const admins = db.select('users', {
  role: 'admin',
  status: 'active'
});
```

#### Update

```javascript
const result = db.update(
  'users',
  { email: 'newemail@example.com', updated: new Date() },
  { id: 1 }
);

// Result: { status: 'success', rowsAffected: 1, duration: 10 }
```

#### Delete

```javascript
const result = db.delete('users', { id: 1 });

// Result: { status: 'success', rowsAffected: 1, duration: 8 }
```

### Transaction Management

```javascript
// Begin transaction
const tx = db.beginTransaction();
// { status: 'success', transactionId: '...' }

try {
  // Execute queries within transaction
  db.insert('users', { name: 'Bob' });
  db.insert('posts', { userId: 1, title: 'First' });
  
  // Commit if successful
  db.commit(tx.transactionId);
  // { status: 'success', queriesExecuted: 2 }
} catch (error) {
  // Rollback on error
  db.rollback(tx.transactionId);
  // { status: 'success', queriesReverted: 2 }
}
```

### Table Management

#### Create Table

```javascript
const schema = {
  id: 'INT PRIMARY KEY',
  name: 'VARCHAR(100)',
  email: 'VARCHAR(100)',
  created: 'TIMESTAMP',
  updated: 'TIMESTAMP'
};

db.createTable('users', schema);
```

#### List Tables

```javascript
const result = db.listTables();
// {
//   status: 'success',
//   tables: ['users', 'posts', 'comments'],
//   count: 3
// }
```

#### Get Table Info

```javascript
const info = db.getTableInfo('users');
// {
//   status: 'success',
//   table: {
//     name: 'users',
//     schema: { id: 'INT PRIMARY KEY', ... },
//     createdAt: '2026-09-29T...',
//     rowCount: 0
//   }
// }
```

#### Drop Table

```javascript
db.dropTable('users');
// { status: 'success', ... }
```

## API Reference

### Methods

#### `db.connect(config)`
Connect to database with optional configuration override.

#### `db.disconnect(connectionId)`
Disconnect from database.

#### `db.query(sql, params, connectionId)`
Execute raw SQL query.

#### `db.insert(table, data, connectionId)`
Insert row into table.

```javascript
db.insert('users', { name: 'Alice', age: 25 });
```

#### `db.select(table, where, connectionId)`
Select rows from table with optional WHERE clause.

```javascript
db.select('users', { status: 'active' });
```

#### `db.update(table, data, where, connectionId)`
Update rows in table.

```javascript
db.update('users', { name: 'Bob' }, { id: 1 });
```

#### `db.delete(table, where, connectionId)`
Delete rows from table.

```javascript
db.delete('users', { id: 1 });
```

#### `db.createTable(tableName, schema)`
Create new table with schema.

#### `db.dropTable(tableName)`
Drop table.

#### `db.listTables()`
List all tables.

#### `db.getTableInfo(tableName)`
Get table schema and metadata.

#### `db.beginTransaction(connectionId)`
Start a transaction.

#### `db.commit(transactionId)`
Commit transaction.

#### `db.rollback(transactionId)`
Rollback transaction.

#### `db.status()`
Get database connection status.

#### `db.getQueryHistory(limit)`
Get recent query history (default: last 10).

#### `db.clearQueryHistory()`
Clear query history.

#### `db.init()`
Initialize plugin.

#### `db.shutdown()`
Shutdown and cleanup.

## Execute Interface

Use plugin.execute() for programmatic operations:

```javascript
// Insert
db.execute({
  action: 'insert',
  table: 'users',
  data: { name: 'Alice' }
});

// Select
db.execute({
  action: 'select',
  table: 'users',
  where: { id: 1 }
});

// Update
db.execute({
  action: 'update',
  table: 'users',
  data: { name: 'Bob' },
  where: { id: 1 }
});

// Delete
db.execute({
  action: 'delete',
  table: 'users',
  where: { id: 1 }
});

// Raw query
db.execute({
  action: 'query',
  sql: 'SELECT COUNT(*) FROM users',
  params: []
});

// Create table
db.execute({
  action: 'createTable',
  table: 'posts',
  data: { id: 'INT', title: 'VARCHAR(255)' }
});

// Status
db.execute({ action: 'status' });
```

## Configuration

Configure at plugin registration:

```javascript
manager.register('db', DatabasePlugin, {
  name: 'Application Database',
  type: 'sqlite',           // sqlite, postgresql, mysql
  host: 'localhost',
  port: 5432,
  database: 'app_db',
  username: 'dbuser',
  password: 'dbpass',
  poolSize: 10              // Connection pool size
});
```

## Examples

### User Management System

```javascript
const db = manager.get('db');

// Create schema
db.createTable('users', {
  id: 'INT PRIMARY KEY AUTO_INCREMENT',
  username: 'VARCHAR(50) UNIQUE',
  email: 'VARCHAR(100) UNIQUE',
  password: 'VARCHAR(255)',
  created: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
});

// Create user
db.insert('users', {
  username: 'alice',
  email: 'alice@example.com',
  password: 'hashed_password'
});

// Get user
const user = db.select('users', { username: 'alice' });

// Update user
db.update('users', 
  { email: 'newemail@example.com' },
  { username: 'alice' }
);

// Delete user
db.delete('users', { username: 'alice' });
```

### Blog System with Transactions

```javascript
const db = manager.get('db');

// Create tables
db.createTable('posts', {
  id: 'INT PRIMARY KEY',
  userId: 'INT',
  title: 'VARCHAR(255)',
  content: 'TEXT',
  published: 'BOOLEAN DEFAULT FALSE'
});

db.createTable('comments', {
  id: 'INT PRIMARY KEY',
  postId: 'INT',
  userId: 'INT',
  text: 'TEXT'
});

// Create post with transaction
const tx = db.beginTransaction();
try {
  const post = db.insert('posts', {
    userId: 1,
    title: 'My First Post',
    content: 'Hello World!',
    published: true
  });
  
  db.insert('comments', {
    postId: 1,
    userId: 2,
    text: 'Great post!'
  });
  
  db.commit(tx.transactionId);
} catch (error) {
  db.rollback(tx.transactionId);
  throw error;
}
```

## Supported Databases

### SQLite
- No setup required
- File-based
- Single file database

```javascript
DatabasePlugin({ type: 'sqlite', database: 'app.db' })
```

### PostgreSQL
- Recommended for production
- Full SQL support
- Advanced features

```javascript
DatabasePlugin({
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  username: 'user',
  password: 'pass'
})
```

### MySQL
- Popular choice
- Good performance
- Wide compatibility

```javascript
DatabasePlugin({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'myapp',
  username: 'root',
  password: 'pass'
})
```

## Performance

- Connection pooling: 10 connections by default
- Query tracking for performance monitoring
- Efficient transaction handling
- Fast CRUD operations

## Testing

Run database plugin tests:

```bash
npm test -- database-plugin.test.js
npm test -- --testPathPattern=database

# With coverage
npm run test:coverage
```

## Limitations

- In-memory operation (no persistence across restarts)
- Single-threaded query execution
- No automatic query optimization
- Limited to basic transactions

## Best Practices

1. **Always use transactions** for multi-step operations
2. **Use parameterized queries** to prevent SQL injection
3. **Close connections** when done
4. **Monitor query history** for performance tuning
5. **Use connection pooling** for high-load scenarios
6. **Log database operations** using Logger plugin

## Integration

Works seamlessly with other plugins:

```javascript
const logger = manager.get('logger');
const db = manager.get('db');

// Log database operations
db.query('SELECT * FROM users');
logger.info('Users fetched', { count: 5 });
```

## Future Enhancements

- [ ] Real database drivers (SQLite, PostgreSQL, MySQL)
- [ ] Connection pool optimization
- [ ] Query caching
- [ ] Automatic migrations
- [ ] Schema validation
- [ ] Performance profiling
- [ ] Backup/restore functionality
- [ ] Replication support
