const db = require('./database');

// Insert a test notification for user ID 1 (Lesly Tilio) to test the UI
db.prepare(`
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (?, 'approval', ?, ?)
`).run(
  1,
  '🎉 Registration Approved!',
  'Congratulations Lesly! Your Bugema University Alumni registration has been approved as an Ordinary member. You now have full access to all alumni features including Chat, SACCO, Events, and Career Opportunities.'
);

console.log('Test notification inserted for user ID 1 (Lesly Tilio)');
console.log('\nNotifications now:');
db.prepare("SELECT * FROM notifications").all().forEach(n =>
  console.log(`[${n.id}] user_id:${n.user_id} | ${n.title} | is_read:${n.is_read}`)
);
