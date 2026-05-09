/**
 * Bugema University Alumni Portal — Database Setup
 * Uses SQLite via better-sqlite3 for zero-config persistence
 */
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'alumni.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// ── Create Tables ──────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    email           TEXT    NOT NULL UNIQUE,
    password_hash   TEXT    NOT NULL,
    role            TEXT    NOT NULL CHECK(role IN ('alumni','student','admin')) DEFAULT 'student',
    membership_tier TEXT,
    payment_tx_id   TEXT,
    status          TEXT    NOT NULL DEFAULT 'pending',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS donations (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    donor_name      TEXT    NOT NULL,
    email           TEXT    NOT NULL,
    amount          REAL    NOT NULL,
    currency        TEXT    NOT NULL DEFAULT 'UGX',
    purpose         TEXT    NOT NULL DEFAULT 'General Fund',
    category        TEXT    NOT NULL DEFAULT 'fundraising',
    payment_method  TEXT    NOT NULL,
    tx_ref          TEXT    UNIQUE,
    flw_ref         TEXT,
    flw_tx_id       INTEGER,
    status          TEXT    NOT NULL DEFAULT 'pending',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    posted_by     INTEGER NOT NULL,
    poster_name   TEXT    NOT NULL,
    title         TEXT    NOT NULL,
    company       TEXT    NOT NULL,
    location      TEXT    NOT NULL,
    type          TEXT    NOT NULL DEFAULT 'Full-time',
    description   TEXT    NOT NULL,
    requirements  TEXT,
    salary_range  TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (posted_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS internships (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    posted_by     INTEGER NOT NULL,
    poster_name   TEXT    NOT NULL,
    title         TEXT    NOT NULL,
    company       TEXT    NOT NULL,
    location      TEXT    NOT NULL,
    duration      TEXT    NOT NULL DEFAULT '3 months',
    description   TEXT    NOT NULL,
    requirements  TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (posted_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id   INTEGER NOT NULL,
    sender_name TEXT    NOT NULL,
    sender_role TEXT    NOT NULL,
    message     TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (sender_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS feedback (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    rating          INTEGER NOT NULL,
    label           TEXT    NOT NULL,
    comment         TEXT,
    reviewer_name   TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    form_type   TEXT    NOT NULL,
    data_json   TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

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

  CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    type       TEXT    NOT NULL,
    title      TEXT    NOT NULL,
    message    TEXT    NOT NULL,
    is_read    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS withdrawals (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    amount       REAL    NOT NULL,
    reason       TEXT    NOT NULL,
    method       TEXT    NOT NULL,
    account_ref  TEXT    NOT NULL,
    withdrawn_by TEXT    NOT NULL DEFAULT 'Admin',
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
