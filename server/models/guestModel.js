const db = require("../config/database")

const Guest = {
    async getAll() {
        const [rows] = await db.query(
            "SELECT g.*, e.name as event_name FROM guests g JOIN events e ON g.event_id = e.id ORDER BY g.id DESC"
        )
        return rows
    },
    async getByEventId(eventId) {
        const [rows] = await db.query(
            "SELECT * FROM guests WHERE event_id = ?",
            [eventId]
        )
        return rows
    },
    async create(data) {
        const { event_id, name, email, phone, qr_code } = data
        const [result] = await db.query(
            "INSERT INTO guests(event_id, name, email, phone, qr_code) VALUES(?,?,?,?,?)",
            [event_id, name, email, phone, qr_code || ""]
        )
        return result.insertId
    },
    async update(id, data) {
        const { name, email, phone, checked_in } = data
        const [result] = await db.query(
            "UPDATE guests SET name=?, email=?, phone=?, checked_in=? WHERE id=?",
            [name, email, phone, checked_in, id]
        )
        return result.affectedRows
    },
    async delete(id) {
        const [result] = await db.query("DELETE FROM guests WHERE id=?", [id])
        return result.affectedRows
    },
    async toggleCheckin(id, status) {
        const [result] = await db.query(
            "UPDATE guests SET checked_in=? WHERE id=?",
            [status, id]
        )
        return result.affectedRows
    }
}

module.exports = Guest