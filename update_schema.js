const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'alumni.db');
const db = new Database(DB_PATH);

console.log('Running database schema updates...');

const migrations = [
  { col: 'membership_tier', sql: "ALTER TABLE users ADD COLUMN membership_tier TEXT;" },
  { col: 'payment_tx_id',   sql: "ALTER TABLE users ADD COLUMN payment_tx_id TEXT;" },
  { col: 'status',          sql: "ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'approved';" },
];

for (const m of migrations) {
  try {
    db.exec(m.sql);
    console.log(`  ✓ Added column ${m.col} to users`);
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log(`  · Column ${m.col} already exists`);
    } else {
      console.error(`  ✗ Error adding ${m.col}:`, err.message);
    }
  }
}

// Create SACCO contributions table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sacco_contributions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL,
      user_name       TEXT    NOT NULL,
      membership_tier TEXT,
      amount          REAL    NOT NULL,
      tx_id           TEXT    NOT NULL,
      note            TEXT,
      status          TEXT    NOT NULL DEFAULT 'pending',
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log('  ✓ sacco_contributions table ready');
} catch (err) {
  console.error('  ✗ Error creating sacco_contributions:', err.message);
}

console.log('\nDatabase update complete.');
