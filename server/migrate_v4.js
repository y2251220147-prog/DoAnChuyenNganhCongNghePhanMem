/**
 * migrate_v4.js
 * Migration script: Cập nhật DB từ schema cũ sang v4.0
 * Chạy: node server/migrate_v4.js
 */
require("dotenv").config();
const mysql = require("mysql2/promise");

async function main() {
    console.log("🚀 Bắt đầu migration v4.0...\n");

    const db = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "event_management",
        multipleStatements: true
    });

    try {
        await db.query("SET FOREIGN_KEY_CHECKS = 0");

        // ── 1. Tạo bảng departments nếu chưa có ─────────────────
        console.log("📦 [1/8] Tạo bảng departments...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS departments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY name (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Thêm phòng ban mẫu nếu chưa có
        const [depts] = await db.query("SELECT COUNT(*) as c FROM departments");
        if (depts[0].c === 0) {
            await db.query(`
                INSERT INTO departments (name, description) VALUES
                ('Ban Tổ Chức', 'Phòng ban phụ trách tổ chức sự kiện'),
                ('Phòng Marketing', 'Phòng ban phụ trách truyền thông và quảng bá'),
                ('Phòng Kỹ Thuật', 'Phòng ban phụ trách kỹ thuật và công nghệ'),
                ('Phòng Hành Chính', 'Phòng ban hành chính nhân sự'),
                ('Phòng Tài Chính', 'Phòng ban tài chính kế toán')
            `);
            console.log("   ✅ Đã tạo 5 phòng ban mẫu");
        }
        console.log("   ✅ Xong\n");

        // ── 2. Thêm cột department_id vào users ──────────────────
        console.log("📦 [2/8] Cập nhật bảng users...");
        const [cols] = await db.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'department_id'
        `);
        if (cols.length === 0) {
            await db.query(`ALTER TABLE users ADD COLUMN department_id INT DEFAULT NULL AFTER role`);
            await db.query(`
                ALTER TABLE users ADD CONSTRAINT users_ibfk_dept
                FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
            `);
            console.log("   ✅ Đã thêm cột department_id");
        } else {
            console.log("   ⏭️  Cột department_id đã tồn tại");
        }
        console.log("   ✅ Xong\n");

        // ── 3. Xóa cột manager_id và tracker_id khỏi events ─────
        console.log("📦 [3/8] Xóa manager_id và tracker_id khỏi events...");
        for (const col of ["manager_id", "tracker_id"]) {
            const [c] = await db.query(`
                SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'events' AND COLUMN_NAME = ?
            `, [col]);
            if (c.length > 0) {
                // Xóa FK trước
                try {
                    const [fks] = await db.query(`
                        SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'events' AND COLUMN_NAME = ?
                        AND REFERENCED_TABLE_NAME IS NOT NULL
                    `, [col]);
                    for (const fk of fks) {
                        await db.query(`ALTER TABLE events DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
                    }
                } catch (e) { /* ignore */ }
                await db.query(`ALTER TABLE events DROP COLUMN ${col}`);
                console.log(`   ✅ Đã xóa cột ${col}`);
            } else {
                console.log(`   ⏭️  Cột ${col} không tồn tại`);
            }
        }
        console.log("   ✅ Xong\n");

        // ── 4. Cập nhật event_tasks ─────────────────────────────
        console.log("📦 [4/8] Cập nhật bảng event_tasks...");

        // Thêm assigned_department_id
        const [deptCol] = await db.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_tasks' AND COLUMN_NAME = 'assigned_department_id'
        `);
        if (deptCol.length === 0) {
            await db.query(`ALTER TABLE event_tasks ADD COLUMN assigned_department_id INT DEFAULT NULL AFTER assigned_to`);
            await db.query(`ALTER TABLE event_tasks ADD CONSTRAINT event_tasks_ibfk_dept FOREIGN KEY (assigned_department_id) REFERENCES departments(id) ON DELETE SET NULL`);
            console.log("   ✅ Đã thêm cột assigned_department_id");
        }

        // Đặt due_date NOT NULL (set giá trị mặc định cho records cũ)
        await db.query(`UPDATE event_tasks SET due_date = DATE_ADD(created_at, INTERVAL 7 DAY) WHERE due_date IS NULL`);

        // Cập nhật status: review → in_progress, cancelled → done
        const [reviewRows] = await db.query("SELECT COUNT(*) as c FROM event_tasks WHERE status = 'review'");
        const [cancelledRows] = await db.query("SELECT COUNT(*) as c FROM event_tasks WHERE status = 'cancelled'");
        if (reviewRows[0].c > 0) {
            await db.query("UPDATE event_tasks SET status = 'in_progress' WHERE status = 'review'");
            console.log(`   ✅ Migrate ${reviewRows[0].c} task từ 'review' → 'in_progress'`);
        }
        if (cancelledRows[0].c > 0) {
            await db.query("UPDATE event_tasks SET status = 'done' WHERE status = 'cancelled'");
            console.log(`   ✅ Migrate ${cancelledRows[0].c} task từ 'cancelled' → 'done'`);
        }

        // Đổi ENUM status
        await db.query(`ALTER TABLE event_tasks MODIFY COLUMN status ENUM('todo','in_progress','done') DEFAULT 'todo'`);
        console.log("   ✅ Đã cập nhật ENUM status → (todo, in_progress, done)");

        // Đổi due_date NOT NULL
        await db.query(`ALTER TABLE event_tasks MODIFY COLUMN due_date DATETIME NOT NULL`);
        console.log("   ✅ Đã cập nhật due_date thành NOT NULL");

        // Xóa cột deadline_id nếu còn
        const [dlCol] = await db.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_tasks' AND COLUMN_NAME = 'deadline_id'
        `);
        if (dlCol.length > 0) {
            try {
                const [fks] = await db.query(`
                    SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_tasks' AND COLUMN_NAME = 'deadline_id'
                    AND REFERENCED_TABLE_NAME IS NOT NULL
                `);
                for (const fk of fks) {
                    await db.query(`ALTER TABLE event_tasks DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
                }
            } catch (e) { /* ignore */ }
            await db.query(`ALTER TABLE event_tasks DROP COLUMN deadline_id`);
            console.log("   ✅ Đã xóa cột deadline_id");
        }
        console.log("   ✅ Xong\n");

        // ── 5. Thêm cột organization vào attendees ──────────────
        console.log("📦 [5/8] Cập nhật bảng attendees...");
        const [orgCol] = await db.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendees' AND COLUMN_NAME = 'organization'
        `);
        if (orgCol.length === 0) {
            await db.query(`ALTER TABLE attendees ADD COLUMN organization VARCHAR(200) DEFAULT NULL AFTER phone`);
            console.log("   ✅ Đã thêm cột organization");
        }
        console.log("   ✅ Xong\n");

        // ── 6. Xóa bảng event_deadlines ─────────────────────────
        console.log("📦 [6/8] Xóa bảng event_deadlines (gộp vào event_tasks.due_date)...");
        await db.query("DROP TABLE IF EXISTS event_deadlines");
        console.log("   ✅ Xong\n");

        // ── 7. Xóa bảng guests ──────────────────────────────────
        console.log("📦 [7/8] Xóa bảng guests (hợp nhất vào attendees)...");
        await db.query("DROP TABLE IF EXISTS guests");
        console.log("   ✅ Xong\n");

        // ── 8. Thêm unique constraint cho event_staff ───────────
        console.log("📦 [8/8] Cập nhật bảng event_staff...");
        try {
            await db.query(`ALTER TABLE event_staff ADD UNIQUE KEY unique_staff_event (event_id, user_id)`);
            console.log("   ✅ Đã thêm unique constraint");
        } catch (e) {
            if (e.code !== "ER_DUP_KEYNAME") console.log("   ⏭️  Unique key đã tồn tại");
        }
        console.log("   ✅ Xong\n");

        await db.query("SET FOREIGN_KEY_CHECKS = 1");

        console.log("=".repeat(50));
        console.log("🎉 Migration v4.0 hoàn thành thành công!");
        console.log("=".repeat(50));

    } catch (err) {
        console.error("❌ Lỗi migration:", err.message);
        process.exit(1);
    } finally {
        await db.end();
    }
}

main();
