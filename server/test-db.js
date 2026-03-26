const db = require("./config/database");

async function check() {
    try {
        const [cols] = await db.query("SHOW COLUMNS FROM attendees");
        console.log("Attendees columns:", cols.map(c => c.Field));
    } catch(err) {
        console.error("DB Error:", err.message);
    }
    process.exit();
}

check();
