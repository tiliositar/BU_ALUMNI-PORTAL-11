const db = require('./database');

// Show all users
const users = db.prepare("SELECT id, name, email, role, status FROM users ORDER BY role").all();
console.log('\n=== ALL USERS ===');
users.forEach(u => console.log(`[${u.id}] ${u.role.toUpperCase()} | ${u.name} | ${u.email} | status: ${u.status}`));

// Show notifications
const notifs = db.prepare("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10").all();
console.log('\n=== NOTIFICATIONS ===');
if (!notifs.length) console.log('(none yet)');
notifs.forEach(n => console.log(`[${n.id}] user_id:${n.user_id} | ${n.type} | is_read:${n.is_read} | ${n.title}`));
