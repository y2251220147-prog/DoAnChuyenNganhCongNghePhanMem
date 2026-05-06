const db = require("../config/database");

const EventDept = {
    // Lấy tất cả phân công phòng ban
    getAll: async () => {
        const [rows] = await db.query(`
            SELECT ed.id, ed.event_id, ed.department_id, ed.role, ed.note, ed.assigned_at,
                   e.name AS event_name, e.start_date, e.status AS event_status,
                   d.name AS department_name, d.manager_id,
                   m.name AS manager_name,
                   COUNT(u.id) AS employee_count
            FROM event_departments ed
            LEFT JOIN events e ON ed.event_id = e.id
            LEFT JOIN departments d ON ed.department_id = d.id
            LEFT JOIN users m ON d.manager_id = m.id
            LEFT JOIN users u ON u.department_id = d.id
            GROUP BY ed.id
            ORDER BY ed.assigned_at DESC
        `);
        return rows;
    },

    // Lấy phân công theo sự kiện
    getByEvent: async (eventId) => {
        const [rows] = await db.query(`
            SELECT ed.id, ed.event_id, ed.department_id, ed.role, ed.note, ed.assigned_at,
                   d.name AS department_name, d.manager_id,
                   m.name AS manager_name,
                   COUNT(u.id) AS employee_count
            FROM event_departments ed
            LEFT JOIN departments d ON ed.department_id = d.id
            LEFT JOIN users m ON d.manager_id = m.id
            LEFT JOIN users u ON u.department_id = d.id
            WHERE ed.event_id = ?
            GROUP BY ed.id
            ORDER BY d.name ASC
        `, [eventId]);
        return rows;
    },

    // Kiểm tra đã phân công chưa
    findByEventAndDept: async (eventId, deptId) => {
        const [rows] = await db.query(
            "SELECT id FROM event_departments WHERE event_id = ? AND department_id = ?",
            [eventId, deptId]
        );
        return rows[0] || null;
    },

    // Tạo phân công
    create: async (data) => {
        const [result] = await db.query(
            "INSERT INTO event_departments (event_id, department_id, role, note) VALUES (?, ?, ?, ?)",
            [data.event_id, data.department_id, data.role || "Đảm nhiệm", data.note || null]
        );
        return result.insertId;
    },

    // Xóa phân công
    remove: async (id) => {
        await db.query("DELETE FROM event_departments WHERE id = ?", [id]);
    },

    // Cập nhật role/note
    update: async (id, data) => {
        await db.query(
            "UPDATE event_departments SET role = ?, note = ? WHERE id = ?",
            [data.role, data.note || null, id]
        );
    }
};

module.exports = EventDept;
