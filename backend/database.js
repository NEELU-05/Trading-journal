const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'trading_journal.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database schema
function initializeDatabase() {
  // Create trades table
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
    if (err) {
      console.error('Error creating trades table:', err.message);
    } else {
      console.log('Trades table ready');
    }
  });

  // Create setups table for setup name management
  db.run(`
    CREATE TABLE IF NOT EXISTS setups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating setups table:', err.message);
    } else {
      console.log('Setups table ready');
      // Insert default setups
      const defaultSetups = [
        'Breakout',
        'Pullback',
        'Reversal',
        'Momentum',
        'Range Bound',
        'Trend Following'
      ];
      
      const stmt = db.prepare('INSERT OR IGNORE INTO setups (name) VALUES (?)');
      defaultSetups.forEach(setup => {
        stmt.run(setup);
      });
      stmt.finalize();
    }
  });
}

module.exports = db;
