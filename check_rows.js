const db = require('./database');
const tables = ['jobs', 'internships', 'chat_messages'];
for (const table of tables) {
  try {
    const count = db.prepare(`SELECT count(*) as c FROM ${table}`).get().c;
    console.log(`${table}: ${count} rows`);
  } catch(e) {
    console.log(`${table} error: ${e.message}`);
  }
}
