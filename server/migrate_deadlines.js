const db = require("./config/database");

async function migrate() {
    try {
        console.log("--- Bắt đầu nâng cấp bảng event_deadlines ---");

        // 1. Thêm cột status
        try {
            await db.query(`
                ALTER TABLE event_deadlines 
                ADD COLUMN status ENUM('pending', 'working', 'completed', 'done', 'problem') 
                DEFAULT 'pending' AFTER assigned_to
            `);
            console.log("- Thêm cột status thành công.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("- Cột status đã tồn tại, bỏ qua bước thêm.");
            } else {
                throw e;
            }
        }

        // 2. Chuyển đổi dữ liệu từ done sang status
        // done = 1 -> done
        // done = 0 -> pending
        await db.query(`UPDATE event_deadlines SET status = 'done' WHERE done = 1`);
        await db.query(`UPDATE event_deadlines SET status = 'pending' WHERE done = 0 AND status IS NULL`);
        console.log("- Chuyển đổi dữ liệu done -> status thành công.");

        // 3. Xóa cột done (Tùy chọn, để an toàn tôi sẽ giữ lại hoặc chỉ ẩn đi, 
        // nhưng theo yêu cầu sạch sẽ tôi sẽ xóa nếu bạn chắc chắn)
        // await db.query(`ALTER TABLE event_deadlines DROP COLUMN done`);
        // console.log("- Xóa cột done cũ.");

        console.log("--- Hoàn thành nâng cấp DB ---");
        process.exit(0);
    } catch (err) {
        console.error("Lỗi migration:", err);
        process.exit(1);
    }
}

migrate();
