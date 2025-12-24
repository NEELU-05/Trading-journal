const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

// Determine database mode
const isPostgres = process.env.DATABASE_URL ? true : false;
let db;

if (isPostgres) {
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  console.log('Connected to PostgreSQL database');
  initializePostgres();
} else {
  const dbPath = path.join(__dirname, 'trading_journal.db');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to SQLite database');
      initializeSqlite();
    }
  });
}

// Unified query wrapper
const queryWrapper = {
  // Run a query that doesn't return data (INSERT, UPDATE, DELETE, CREATE)
  run: function (sql, params = [], callback) {
    if (isPostgres) {
      const pgSql = convertToPgSql(sql);
      db.query(pgSql, params)
        .then(res => {
          // Simulate `this` context for callback if needed (e.g., this.lastID)
          const context = { lastID: 0, changes: res.rowCount };
          // For INSERT, try to get the ID from RETURNING clause if we added it
          if (res.rows && res.rows.length > 0 && res.rows[0].id) {
            context.lastID = res.rows[0].id;
          }

          if (callback) callback.call(context, null);
        })
        .catch(err => {
          if (callback) callback(err);
        });
    } else {
      db.run(sql, params, callback);
    }
  },

  // Get a single row
  get: function (sql, params = [], callback) {
    if (isPostgres) {
      const pgSql = convertToPgSql(sql);
      db.query(pgSql, params)
        .then(res => {
          if (callback) callback(null, res.rows[0]);
        })
        .catch(err => {
          if (callback) callback(err);
        });
    } else {
      db.get(sql, params, callback);
    }
  },

  // Get all rows
  all: function (sql, params = [], callback) {
    if (isPostgres) {
      const pgSql = convertToPgSql(sql);
      db.query(pgSql, params)
        .then(res => {
          if (callback) callback(null, res.rows);
        })
        .catch(err => {
          if (callback) callback(err);
        });
    } else {
      db.all(sql, params, callback);
    }
  }
};

// Helper: Convert SQLite specific syntax to PostgreSQL
function convertToPgSql(sql) {
  let pgSql = sql;
  // Replace ? with $1, $2, etc. logic is tricky with simple replace, so we keep simple for now
  // NOTE: This simple wrapper assumes parameterized queries are passed as arrays.
  // We need to replace ? with $1, $2... in order
  let paramIndex = 1;
  while (pgSql.includes('?')) {
    pgSql = pgSql.replace('?', `$${paramIndex}`);
    paramIndex++;
  }

  // Handle INSERT returning ID
  if (pgSql.trim().toUpperCase().startsWith('INSERT')) {
    pgSql += ' RETURNING id';
  }

  // SQLite uses INTEGER PRIMARY KEY AUTOINCREMENT, PG uses SERIAL PRIMARY KEY
  return pgSql;
}

function initializeSqlite() {
  db.run(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      timeframe TEXT NOT NULL,
      direction TEXT NOT NULL,
      datetime TEXT NOT NULL,
      entry_price REAL NOT NULL,
      stop_loss REAL NOT NULL,
      take_profit REAL NOT NULL,
      risk_amount REAL NOT NULL,
      position_size REAL NOT NULL,
      setup_name TEXT NOT NULL,
      htf_trend TEXT NOT NULL,
      entry_reason TEXT NOT NULL,
      confirmations TEXT NOT NULL,
      sl_moved INTEGER NOT NULL DEFAULT 0,
      manual_interference INTEGER NOT NULL DEFAULT 0,
      exit_price REAL,
      pnl REAL,
      r_multiple REAL,
      outcome TEXT,
      followed_rules INTEGER NOT NULL DEFAULT 1,
      biggest_mistake TEXT,
      would_take_again INTEGER NOT NULL DEFAULT 1,
      is_flagged INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `, (err) => {
    if (err) console.error('Error creating trades table:', err.message);
    else console.log('Trades table ready (SQLite)');
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS setups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating setups table:', err.message);
    } else {
      console.log('Setups table ready (SQLite)');
      seedSetups(queryWrapper);
    }
  });
}

function initializePostgres() {
  // PostgreSQL Schema
  const createTrades = `
    CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      symbol TEXT NOT NULL,
      timeframe TEXT NOT NULL,
      direction TEXT NOT NULL,
      datetime TEXT NOT NULL,
      entry_price REAL NOT NULL,
      stop_loss REAL NOT NULL,
      take_profit REAL NOT NULL,
      risk_amount REAL NOT NULL,
      position_size REAL NOT NULL,
      setup_name TEXT NOT NULL,
      htf_trend TEXT NOT NULL,
      entry_reason TEXT NOT NULL,
      confirmations TEXT NOT NULL,
      sl_moved INTEGER NOT NULL DEFAULT 0,
      manual_interference INTEGER NOT NULL DEFAULT 0,
      exit_price REAL,
      pnl REAL,
      r_multiple REAL,
      outcome TEXT,
      followed_rules INTEGER NOT NULL DEFAULT 1,
      biggest_mistake TEXT,
      would_take_again INTEGER NOT NULL DEFAULT 1,
      is_flagged INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createSetups = `
    CREATE TABLE IF NOT EXISTS setups (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );
  `;

  db.query(createTrades)
    .then(() => console.log('Trades table ready (PostgreSQL)'))
    .catch(err => console.error('Error creating trades table:', err.stack));

  db.query(createSetups)
    .then(() => {
      console.log('Setups table ready (PostgreSQL)');
      seedSetups(queryWrapper);
    })
    .catch(err => console.error('Error creating setups table:', err.stack));
}

function seedSetups(dbWrapper) {
  const defaultSetups = [
    'Breakout',
    'Pullback',
    'Reversal',
    'Momentum',
    'Range Bound',
    'Trend Following'
  ];

  // Check if empty first
  dbWrapper.all('SELECT count(*) as count FROM setups', [], (err, rows) => {
    if (err) return;

    // Handle different return structures between drivers
    const count = rows[0].count || rows[0].COUNT;

    if (count == 0) {
      // Prepared statement approach differs, so we loop simpler for compatibility
      defaultSetups.forEach(setup => {
        dbWrapper.run('INSERT INTO setups (name) VALUES (?)', [setup]);
      });
      console.log('Default setups seeded');
    }
  });
}

module.exports = queryWrapper;
