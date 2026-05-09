const db = require('./database');
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      amount         REAL    NOT NULL,
      reason         TEXT    NOT NULL,
      method         TEXT    NOT NULL,
      account_ref    TEXT    NOT NULL,
      withdrawn_by   TEXT    NOT NULL DEFAULT 'Admin',
      created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log('withdrawals table ready');
} catch(e) { console.log(e.message); }
