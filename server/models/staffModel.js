const db = require("../config/database");

exports.getAll = async () => {
    const [rows] = await db.query(
        "SELECT es.*, u.name AS user_name, u.email AS user_email, u.role AS user_role, u.department_id, d.name AS department_name FROM event_staff es LEFT JOIN users u ON es.user_id = u.id LEFT JOIN departments d ON u.department_id = d.id ORDER BY es.id DESC"
    );
    return rows;
};

exports.getByEvent = async (eventId) => {
    const [rows] = await db.query(
        "SELECT es.*, u.name AS user_name, u.email AS user_email, u.role AS user_role, u.department_id, d.name AS department_name FROM event_staff es LEFT JOIN users u ON es.user_id = u.id LEFT JOIN departments d ON u.department_id = d.id WHERE es.event_id = ? ORDER BY es.id DESC",
        [eventId]
    );
    return rows;
};

exports.assign = async (data) => {
    const [result] = await db.query(
        "INSERT INTO event_staff (event_id, user_id, role) VALUES (?, ?, ?)",
        [data.event_id, data.user_id, data.role]
    );
    return result.insertId;
};

exports.remove = async (id) => {
    await db.query("DELETE FROM event_staff WHERE id = ?", [id]);
};
