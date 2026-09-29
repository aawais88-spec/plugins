/**
 * Database Plugin
 * Provides database connection, query execution, and transaction management
 */

class DatabasePlugin {
  constructor(config = {}) {
    this.name = config.name || 'DatabasePlugin';
    this.version = config.version || '1.0.0';
    this.enabled = config.enabled !== false;
    this.type = config.type || 'sqlite'; // sqlite, postgresql, mysql
    this.host = config.host || 'localhost';
    this.port = config.port || 5432;
    this.database = config.database || 'app_db';
    this.username = config.username || '';
    this.password = config.password || '';
    this.poolSize = config.poolSize || 10;

    this.connected = false;
    this.connections = [];
    this.queries = [];
    this.transactions = new Map();
    this.schemas = new Map();
    this.tables = new Map();
  }

  init() {
    if (!this.enabled) {
      console.log(`${this.name} is disabled`);
      return false;
    }
    console.log(`${this.name} v${this.version} initialized (${this.type})`);
    this.connected = true;
    return true;
  }

  /**
   * Connect to database
   * @param {Object} config - Connection config
   */
  connect(config = {}) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    const connectionConfig = { ...this, ...config };

    const connection = {
      id: this._generateId(),
      type: connectionConfig.type,
      host: connectionConfig.host,
      port: connectionConfig.port,
      database: connectionConfig.database,
      connected: true,
      createdAt: new Date().toISOString()
    };

    this.connections.push(connection);
    return {
      status: 'success',
      message: 'Connected to database',
      connectionId: connection.id,
      config: { type: connectionConfig.type, database: connectionConfig.database }
    };
  }

  /**
   * Disconnect from database
   * @param {string} connectionId - Connection ID
   */
  disconnect(connectionId) {
    const index = this.connections.findIndex(c => c.id === connectionId);
    if (index !== -1) {
      this.connections.splice(index, 1);
      return { status: 'success', message: 'Disconnected from database' };
    }
    return { status: 'error', message: 'Connection not found' };
  }

  /**
   * Execute a query
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @param {string} connectionId - Connection ID
   */
  query(sql, params = [], connectionId = null) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    if (!this.connected && !connectionId) {
      throw new Error('Not connected to database');
    }

    const query = {
      id: this._generateId(),
      sql,
      params,
      connectionId: connectionId || (this.connections[0]?.id || 'default'),
      executedAt: new Date().toISOString(),
      duration: Math.floor(Math.random() * 100)
    };

    this.queries.push(query);

    return {
      status: 'success',
      queryId: query.id,
      sql,
      rowsAffected: Math.floor(Math.random() * 10),
      duration: query.duration,
      rows: this._mockResultSet(sql)
    };
  }

  /**
   * Execute INSERT query
   */
  insert(table, data, connectionId = null) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    const params = Object.values(data);

    return this.query(sql, params, connectionId);
  }

  /**
   * Execute SELECT query
   */
  select(table, where = {}, connectionId = null) {
    let sql = `SELECT * FROM ${table}`;
    const params = [];

    if (Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map(key => {
        params.push(where[key]);
        return `${key} = ?`;
      }).join(' AND ');
      sql += ` WHERE ${conditions}`;
    }

    return this.query(sql, params, connectionId);
  }

  /**
   * Execute UPDATE query
   */
  update(table, data, where, connectionId = null) {
    const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    const sql = `UPDATE ${table} SET ${updates} WHERE ${conditions}`;
    const params = [...Object.values(data), ...Object.values(where)];

    return this.query(sql, params, connectionId);
  }

  /**
   * Execute DELETE query
   */
  delete(table, where, connectionId = null) {
    const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    const sql = `DELETE FROM ${table} WHERE ${conditions}`;
    const params = Object.values(where);

    return this.query(sql, params, connectionId);
  }

  /**
   * Begin transaction
   */
  beginTransaction(connectionId = null) {
    const txId = this._generateId();
    const connection = connectionId || (this.connections[0]?.id || 'default');

    this.transactions.set(txId, {
      id: txId,
      connectionId: connection,
      startedAt: new Date().toISOString(),
      queries: [],
      status: 'active'
    });

    return {
      status: 'success',
      message: 'Transaction started',
      transactionId: txId
    };
  }

  /**
   * Commit transaction
   */
  commit(transactionId) {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return { status: 'error', message: 'Transaction not found' };
    }

    transaction.status = 'committed';
    transaction.committedAt = new Date().toISOString();

    return {
      status: 'success',
      message: 'Transaction committed',
      queriesExecuted: transaction.queries.length
    };
  }

  /**
   * Rollback transaction
   */
  rollback(transactionId) {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return { status: 'error', message: 'Transaction not found' };
    }

    transaction.status = 'rolled_back';
    transaction.rolledBackAt = new Date().toISOString();

    return {
      status: 'success',
      message: 'Transaction rolled back',
      queriesReverted: transaction.queries.length
    };
  }

  /**
   * Create a table schema
   */
  createTable(tableName, schema) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    this.tables.set(tableName, {
      name: tableName,
      schema,
      createdAt: new Date().toISOString(),
      rowCount: 0
    });

    const sql = this._generateCreateTableSQL(tableName, schema);
    return this.query(sql, [], null);
  }

  /**
   * Drop a table
   */
  dropTable(tableName) {
    if (this.tables.has(tableName)) {
      this.tables.delete(tableName);
      const sql = `DROP TABLE ${tableName}`;
      return this.query(sql, [], null);
    }
    return { status: 'error', message: `Table ${tableName} not found` };
  }

  /**
   * List all tables
   */
  listTables() {
    return {
      status: 'success',
      tables: Array.from(this.tables.keys()),
      count: this.tables.size
    };
  }

  /**
   * Get table info
   */
  getTableInfo(tableName) {
    const table = this.tables.get(tableName);
    if (!table) {
      return { status: 'error', message: `Table ${tableName} not found` };
    }
    return { status: 'success', table };
  }

  /**
   * Get connection status
   */
  status() {
    return {
      status: this.connected ? 'connected' : 'disconnected',
      type: this.type,
      database: this.database,
      activeConnections: this.connections.length,
      maxConnections: this.poolSize,
      totalQueries: this.queries.length,
      totalTables: this.tables.size,
      activeTransactions: Array.from(this.transactions.values())
        .filter(t => t.status === 'active').length
    };
  }

  /**
   * Get query history
   */
  getQueryHistory(limit = 10) {
    return {
      status: 'success',
      queries: this.queries.slice(-limit),
      total: this.queries.length
    };
  }

  /**
   * Clear query history
   */
  clearQueryHistory() {
    this.queries = [];
    return { status: 'success', message: 'Query history cleared' };
  }

  /**
   * Execute plugin logic
   */
  execute(input) {
    if (!this.enabled) {
      throw new Error(`${this.name} is not enabled`);
    }

    const { action, table, data, where, connectionId, sql, params } = input;

    switch (action) {
      case 'connect':
        return this.connect(input);
      case 'disconnect':
        return this.disconnect(connectionId);
      case 'query':
        return this.query(sql, params, connectionId);
      case 'insert':
        return this.insert(table, data, connectionId);
      case 'select':
        return this.select(table, where, connectionId);
      case 'update':
        return this.update(table, data, where, connectionId);
      case 'delete':
        return this.delete(table, where, connectionId);
      case 'createTable':
        return this.createTable(table, data);
      case 'dropTable':
        return this.dropTable(table);
      case 'listTables':
        return this.listTables();
      case 'status':
        return this.status();
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Internal: Generate unique ID
   */
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Internal: Generate CREATE TABLE SQL
   */
  _generateCreateTableSQL(tableName, schema) {
    const columns = Object.entries(schema)
      .map(([name, type]) => `${name} ${type}`)
      .join(', ');
    return `CREATE TABLE ${tableName} (${columns})`;
  }

  /**
   * Internal: Mock result set based on query
   */
  _mockResultSet(sql) {
    if (sql.toLowerCase().includes('select')) {
      return [
        { id: 1, name: 'Sample 1', created: '2026-09-29' },
        { id: 2, name: 'Sample 2', created: '2026-09-29' }
      ];
    }
    return [];
  }

  shutdown() {
    const status = this.status();
    this.connections.forEach(conn => this.disconnect(conn.id));
    this.connections = [];
    this.queries = [];
    this.transactions.clear();
    this.tables.clear();
    console.log(`${this.name} shutdown (${status.totalQueries} queries cleared, ${status.activeConnections} connections closed)`);
    return true;
  }
}

module.exports = DatabasePlugin;
