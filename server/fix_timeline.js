const mysql = require("mysql2/promise");
require("dotenv").config();

async function fix() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'event_management'
    });
    
    try {
        await connection.query("ALTER TABLE event_timeline MODIFY start_time DATETIME;");
        await connection.query("ALTER TABLE event_timeline MODIFY end_time DATETIME;");
        console.log("SUCCESS: Altered event_timeline start_time and end_time to DATETIME");
    } catch (e) {
        console.error("ERROR:", e.message);
    }
    await connection.end();
}

fix();
