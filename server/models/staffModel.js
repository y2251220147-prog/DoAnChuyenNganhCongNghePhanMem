const db = require("../config/database");

exports.getAll = async () => {
    const [rows] = await db.query(
        `SELECT es.*, u.name AS user_name, u.email AS user_email,
                u.department_id, d.name AS department_name, u.role_in_dept,
                e.name AS event_name, e.status AS event_status
         FROM event_staff es
         LEFT JOIN users u ON es.user_id = u.id
         LEFT JOIN departments d ON u.department_id = d.id
         LEFT JOIN events e ON es.event_id = e.id
         ORDER BY es.id DESC`
    );
    return rows;
};

exports.getByEvent = async (eventId) => {
    const [rows] = await db.query(
        `SELECT es.*, u.name AS user_name, u.email AS user_email,
                u.department_id, d.name AS department_name, u.role_in_dept,
                e.name AS event_name, e.status AS event_status
         FROM event_staff es
         LEFT JOIN users u ON es.user_id = u.id
         LEFT JOIN departments d ON u.department_id = d.id
         LEFT JOIN events e ON es.event_id = e.id
         WHERE es.event_id = ?
         ORDER BY es.id DESC`,
        [eventId]
    );
    return rows;
};

exports.assign = async (data) => {
    // Kiểm tra xem có đang là attendee không
    const [isAttendee] = await db.query(
        "SELECT id FROM attendees WHERE event_id = ? AND user_id = ?",
        [data.event_id, data.user_id]
    );
    if (isAttendee.length > 0) {
        throw new Error("Nhân viên này đã đăng ký tham gia sự kiện với tư cách người tham dự, không thể thêm vào ban tổ chức.");
    }

    const [result] = await db.query(
        "INSERT INTO event_staff (event_id, user_id, role) VALUES (?, ?, ?)",
        [data.event_id, data.user_id, data.role]
    );
    return result.insertId;
};

// Kiểm tra user đã được assign vào event chưa
exports.findByEventAndUser = async (eventId, userId) => {
    const [rows] = await db.query(
        "SELECT id FROM event_staff WHERE event_id = ? AND user_id = ?",
        [eventId, userId]
    );
    return rows[0] || null;
};

// Gán toàn bộ nhân viên của 1 phòng ban vào sự kiện
exports.assignByDepartment = async (eventId, departmentId, role) => {
    // Lấy danh sách nhân viên của phòng ban
    const [users] = await db.query(
        "SELECT id FROM users WHERE department_id = ? AND role = 'user'",
        [departmentId]
    );
    if (users.length === 0) return { assigned: 0, skipped: 0 };

    let assigned = 0, skipped = 0;
    for (const u of users) {
        // 1. Bỏ qua nếu đã assign rồi
        const existing = await exports.findByEventAndUser(eventId, u.id);
        if (existing) { skipped++; continue; }

        // 2. Bỏ qua nếu là attendee
        const [isAttendee] = await db.query(
            "SELECT id FROM attendees WHERE event_id = ? AND user_id = ?",
            [eventId, u.id]
        );
        if (isAttendee.length > 0) { skipped++; continue; }

        await db.query(
            "INSERT INTO event_staff (event_id, user_id, role) VALUES (?, ?, ?)",
            [eventId, u.id, role]
        );
        assigned++;
    }
    return { assigned, skipped, total: users.length };
};

exports.remove = async (id) => {
    await db.query("DELETE FROM event_staff WHERE id = ?", [id]);
};
