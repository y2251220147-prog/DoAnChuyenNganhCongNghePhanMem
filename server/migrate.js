require("dotenv").config();
const db = require("./config/database");

async function migrate() {
    console.log("🔄 Running migration...");
    const steps = [
        {
            name: "feedback table",
            sql: `CREATE TABLE IF NOT EXISTS feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT,
                name VARCHAR(100),
                email VARCHAR(150),
                rating TINYINT DEFAULT 5,
                message TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
            )`
        },
        { name: "events.status", sql: `ALTER TABLE events ADD COLUMN IF NOT EXISTS status ENUM('planned','active','completed','cancelled') DEFAULT 'planned'` },
        { name: "event_budget.note", sql: `ALTER TABLE event_budget ADD COLUMN IF NOT EXISTS note TEXT` },
        { name: "guests.qr_code", sql: `ALTER TABLE guests ADD COLUMN IF NOT EXISTS qr_code VARCHAR(255) UNIQUE` },
    ];

    for (const s of steps) {
        try {
            await db.query(s.sql);
            console.log(`  ✅ ${s.name}`);
        } catch (e) {
            console.log(`  ⏭️  ${s.name}: ${e.message}`);
        }
    }
    console.log("✅ Done!");
    process.exit(0);
}

migrate().catch(e => { console.error(e.message); process.exit(1); });