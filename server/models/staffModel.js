const db = require("../config/database")

const Staff = {
    async getAll() {
        const [rows] = await db.query(
            `SELECT t.*, u.name as staff_name, u.department, e.name as event_name 
             FROM event_staff t 
             JOIN users u ON t.user_id = u.id 
             JOIN events e ON t.event_id = e.id 
             ORDER BY t.event_id DESC`
        )
        return rows
    },
    async getByEventId(eventId) {
        const [rows] = await db.query(
            `SELECT t.*, u.name, u.email, u.department 
             FROM event_staff t 
             JOIN users u ON t.user_id = u.id 
             WHERE t.event_id = ?`,
            [eventId]
        )
        return rows
    },
    async assign(data) {
        const { event_id, user_id, role } = data
        const [result] = await db.query(
            "INSERT INTO event_staff(event_id, user_id, role) VALUES(?,?,?)",
            [event_id, user_id, role]
        )
        return result.insertId
    },
    async remove(id) {
        const [result] = await db.query("DELETE FROM event_staff WHERE id=?", [id])
        return result.affectedRows
    }
}

module.exports = Staff