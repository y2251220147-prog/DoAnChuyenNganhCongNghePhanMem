require("dotenv").config();
const db = require("./config/database");

async function main() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS event_departments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            department_id INT NOT NULL,
            role VARCHAR(100) DEFAULT 'Đảm nhiệm',
            note TEXT NULL,
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_event_dept (event_id, department_id),
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
            FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
        )
    `);
    console.log("✅ Table event_departments created OK");
    const [rows] = await db.query("SELECT COUNT(*) as cnt FROM event_departments");
    console.log("Current event_departments records:", rows[0].cnt);
    process.exit(0);
}
main().catch(e => { console.error("Error:", e.message); process.exit(1); });
