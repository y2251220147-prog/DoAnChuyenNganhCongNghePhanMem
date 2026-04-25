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
        { name: "events.status", sql: `ALTER TABLE events ADD COLUMN status ENUM('planned','active','completed','cancelled') DEFAULT 'planned'` },
        { name: "event_budget.note", sql: `ALTER TABLE event_budget ADD COLUMN note TEXT` },
        { name: "guests.qr_code", sql: `ALTER TABLE guests ADD COLUMN qr_code VARCHAR(255) UNIQUE` },
        { name: "users.gender", sql: `ALTER TABLE users ADD COLUMN gender ENUM('male', 'female', 'other')` },
        { name: "users.address", sql: `ALTER TABLE users ADD COLUMN address VARCHAR(255)` },
        { name: "events roles", sql: `ALTER TABLE events 
            ADD COLUMN organizer_id INT DEFAULT NULL,
            ADD COLUMN manager_id INT DEFAULT NULL,
            ADD COLUMN tracker_id INT DEFAULT NULL,
            ADD COLUMN coordination_unit TEXT DEFAULT NULL` },
        { name: "event_deadlines.assigned_to", sql: `ALTER TABLE event_deadlines ADD COLUMN assigned_to INT DEFAULT NULL` },
        { name: "event_tasks refinement", sql: `ALTER TABLE event_tasks 
            ADD COLUMN estimated_budget DECIMAL(18,2) DEFAULT 0.00,
            ADD COLUMN feedback_status ENUM('none', 'completed', 'incomplete', 'budget_shortage', 'difficulty') DEFAULT 'none',
            ADD COLUMN feedback_note TEXT DEFAULT NULL` },
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