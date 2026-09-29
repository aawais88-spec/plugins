/**
 * Database Plugin Tests
 */

const DatabasePlugin = require('../plugins/database-plugin');

describe('DatabasePlugin', () => {
  let db;

  beforeEach(() => {
    db = new DatabasePlugin({
      name: 'Test DB',
      type: 'sqlite',
      database: 'test.db'
    });
  });

  describe('Initialization', () => {
    test('should initialize successfully', () => {
      const result = db.init();
      expect(result).toBe(true);
      expect(db.connected).toBe(true);
    });

    test('should handle disabled state', () => {
      const disabledDb = new DatabasePlugin({ enabled: false });
      expect(disabledDb.init()).toBe(false);
    });

    test('should set configuration', () => {
      expect(db.type).toBe('sqlite');
      expect(db.database).toBe('test.db');
    });
  });

  describe('Connection Management', () => {
    beforeEach(() => db.init());

    test('should connect to database', () => {
      const result = db.connect();
      expect(result.status).toBe('success');
      expect(result.connectionId).toBeDefined();
    });

    test('should track multiple connections', () => {
      db.connect();
      db.connect();
      db.connect();
      expect(db.connections.length).toBe(3);
    });

    test('should disconnect from database', () => {
      const connect = db.connect();
      const result = db.disconnect(connect.connectionId);
      expect(result.status).toBe('success');
      expect(db.connections.length).toBe(0);
    });

    test('should handle disconnect of non-existent connection', () => {
      const result = db.disconnect('invalid-id');
      expect(result.status).toBe('error');
    });
  });

  describe('Query Execution', () => {
    beforeEach(() => {
      db.init();
      db.connect();
    });

    test('should execute raw query', () => {
      const result = db.query('SELECT * FROM users');
      expect(result.status).toBe('success');
      expect(result.queryId).toBeDefined();
      expect(result.sql).toBe('SELECT * FROM users');
    });

    test('should execute query with parameters', () => {
      const result = db.query('SELECT * FROM users WHERE id = ?', [1]);
      expect(result.status).toBe('success');
      expect(result.rowsAffected).toBeDefined();
    });

    test('should track query history', () => {
      db.query('SELECT * FROM users');
      db.query('SELECT * FROM posts');
      db.query('SELECT * FROM comments');
      expect(db.queries.length).toBe(3);
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(() => {
      db.init();
      db.connect();
    });

    test('should insert data', () => {
      const result = db.insert('users', { name: 'John', email: 'john@example.com' });
      expect(result.status).toBe('success');
      expect(result.sql).toContain('INSERT INTO users');
    });

    test('should select data', () => {
      const result = db.select('users', { id: 1 });
      expect(result.status).toBe('success');
      expect(result.sql).toContain('SELECT * FROM users');
      expect(result.sql).toContain('WHERE');
    });

    test('should update data', () => {
      const result = db.update('users', { name: 'Jane' }, { id: 1 });
      expect(result.status).toBe('success');
      expect(result.sql).toContain('UPDATE users');
    });

    test('should delete data', () => {
      const result = db.delete('users', { id: 1 });
      expect(result.status).toBe('success');
      expect(result.sql).toContain('DELETE FROM users');
    });
  });

  describe('Transaction Management', () => {
    beforeEach(() => {
      db.init();
      db.connect();
    });

    test('should begin transaction', () => {
      const result = db.beginTransaction();
      expect(result.status).toBe('success');
      expect(result.transactionId).toBeDefined();
    });

    test('should commit transaction', () => {
      const tx = db.beginTransaction();
      const result = db.commit(tx.transactionId);
      expect(result.status).toBe('success');
    });

    test('should rollback transaction', () => {
      const tx = db.beginTransaction();
      const result = db.rollback(tx.transactionId);
      expect(result.status).toBe('success');
    });

    test('should handle invalid transaction', () => {
      const result = db.commit('invalid-id');
      expect(result.status).toBe('error');
    });

    test('should track transaction status', () => {
      const tx = db.beginTransaction();
      const transaction = db.transactions.get(tx.transactionId);
      expect(transaction.status).toBe('active');

      db.commit(tx.transactionId);
      expect(transaction.status).toBe('committed');
    });
  });

  describe('Table Management', () => {
    beforeEach(() => {
      db.init();
      db.connect();
    });

    test('should create table', () => {
      const schema = { id: 'INT', name: 'VARCHAR(100)', email: 'VARCHAR(100)' };
      const result = db.createTable('users', schema);
      expect(result.status).toBe('success');
      expect(db.tables.has('users')).toBe(true);
    });

    test('should list tables', () => {
      db.createTable('users', { id: 'INT' });
      db.createTable('posts', { id: 'INT' });

      const result = db.listTables();
      expect(result.status).toBe('success');
      expect(result.count).toBe(2);
      expect(result.tables).toContain('users');
      expect(result.tables).toContain('posts');
    });

    test('should get table info', () => {
      const schema = { id: 'INT', name: 'VARCHAR(100)' };
      db.createTable('users', schema);

      const result = db.getTableInfo('users');
      expect(result.status).toBe('success');
      expect(result.table.name).toBe('users');
    });

    test('should drop table', () => {
      db.createTable('users', { id: 'INT' });
      const result = db.dropTable('users');
      expect(result.status).toBe('success');
      expect(db.tables.has('users')).toBe(false);
    });

    test('should handle drop non-existent table', () => {
      const result = db.dropTable('nonexistent');
      expect(result.status).toBe('error');
    });
  });

  describe('Status and History', () => {
    beforeEach(() => {
      db.init();
      db.connect();
    });

    test('should return connection status', () => {
      const result = db.status();
      expect(result.status).toBe('connected');
      expect(result.type).toBe('sqlite');
      expect(result.database).toBe('test.db');
    });

    test('should track query history', () => {
      db.query('SELECT * FROM users');
      db.query('SELECT * FROM posts');

      const result = db.getQueryHistory();
      expect(result.status).toBe('success');
      expect(result.queries.length).toBe(2);
      expect(result.total).toBe(2);
    });

    test('should limit query history', () => {
      for (let i = 0; i < 20; i++) {
        db.query(`SELECT * FROM table${i}`);
      }

      const result = db.getQueryHistory(5);
      expect(result.queries.length).toBe(5);
    });

    test('should clear query history', () => {
      db.query('SELECT * FROM users');
      db.query('SELECT * FROM posts');

      const result = db.clearQueryHistory();
      expect(result.status).toBe('success');
      expect(db.queries.length).toBe(0);
    });
  });

  describe('Execute Method', () => {
    beforeEach(() => {
      db.init();
      db.connect();
    });

    test('should execute via interface', () => {
      const result = db.execute({
        action: 'insert',
        table: 'users',
        data: { name: 'John' }
      });
      expect(result.status).toBe('success');
    });

    test('should select via interface', () => {
      const result = db.execute({
        action: 'select',
        table: 'users',
        where: { id: 1 }
      });
      expect(result.status).toBe('success');
    });

    test('should get status via interface', () => {
      const result = db.execute({ action: 'status' });
      expect(result.status).toBe('connected');
    });

    test('should throw on unknown action', () => {
      expect(() => {
        db.execute({ action: 'unknown' });
      }).toThrow();
    });
  });

  describe('Shutdown', () => {
    beforeEach(() => {
      db.init();
      db.connect();
      db.connect();
      db.query('SELECT * FROM users');
    });

    test('should shutdown and cleanup', () => {
      const result = db.shutdown();
      expect(result).toBe(true);
      expect(db.connections.length).toBe(0);
      expect(db.queries.length).toBe(0);
      expect(db.tables.size).toBe(0);
    });
  });
});
