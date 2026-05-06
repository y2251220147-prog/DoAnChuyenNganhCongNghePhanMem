const db = require('./config/database');
async function check() {
    const [events] = await db.query("SELECT id, name, start_date, end_date FROM events");
    console.log("EVENTS:", JSON.stringify(events, null, 2));
    process.exit(0);
}
check();
