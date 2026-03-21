const db = require("../config/database")

const Partner = {
    async getAll() {
        const [rows] = await db.query("SELECT p.*, e.name as event_name FROM event_partners p JOIN events e ON p.event_id = e.id ORDER BY p.id DESC")
        return rows
    },
    async getByEventId(eventId) {
        const [rows] = await db.query("SELECT * FROM event_partners WHERE event_id = ?", [eventId])
        return rows
    },
    async create(data) {
        const { event_id, name, type, value, contact_info } = data
        const [result] = await db.query(
            "INSERT INTO event_partners (event_id, name, type, value, contact_info) VALUES (?, ?, ?, ?, ?)",
            [event_id, name, type, value, contact_info]
        )
        return result.insertId
    },
    async delete(id) {
        const [result] = await db.query("DELETE FROM event_partners WHERE id = ?", [id])
        return result.affectedRows
    }
}

module.exports = Partner
