const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'alumni.db'));

try {
  // Begin transaction
  db.exec('BEGIN TRANSACTION;');

  // 1. Rename bad tables
  db.exec('ALTER TABLE jobs RENAME TO jobs_old;');
  db.exec('ALTER TABLE internships RENAME TO internships_old;');
  db.exec('ALTER TABLE chat_messages RENAME TO chat_messages_old;');

  // 2. Recreate correct tables
  db.exec(`
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
  `);

  // 3. Copy data back
  db.exec('INSERT INTO jobs SELECT * FROM jobs_old;');
  db.exec('INSERT INTO internships SELECT * FROM internships_old;');
  db.exec('INSERT INTO chat_messages SELECT * FROM chat_messages_old;');

  // 4. Drop old tables
  db.exec('DROP TABLE jobs_old;');
  db.exec('DROP TABLE internships_old;');
  db.exec('DROP TABLE chat_messages_old;');

  db.exec('COMMIT;');
  console.log('Successfully fixed database schema!');
} catch (err) {
  db.exec('ROLLBACK;');
  console.error('Migration failed:', err);
}
