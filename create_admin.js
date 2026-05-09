const bcrypt = require('bcryptjs');
const db = require('./database');

async function setupAdmin() {
  const email = 'admin@alumnibugemauniv.ac.ug';
  const name = 'Admin';
  const password = 'Microsoft@2030';
  const role = 'admin';

  console.log('Fixing schema migration...');
  db.pragma('foreign_keys = OFF');
  try {
    db.exec('DROP TABLE IF EXISTS old_users;');
  } catch(e) {
    console.error('Error dropping old_users', e);
  }
  db.pragma('foreign_keys = ON');

  console.log('Inserting admin user...');

  // Remove any old admin accounts before inserting the updated one
  db.prepare("DELETE FROM users WHERE role = 'admin'").run();
  console.log('Old admin account cleared (if any).');

  try {
    const hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
    stmt.run(name, email, hash, role);
    console.log(`✅ Admin user created successfully!`);
  } catch (err) {
    console.error('Error creating admin:', err);
  }
}

setupAdmin();
