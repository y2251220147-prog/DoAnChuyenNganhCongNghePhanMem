const db = require("../config/database")

const Communication = {
    async getAll() {
        const [rows] = await db.query("SELECT c.*, e.name as event_name FROM event_communication c JOIN events e ON c.event_id = e.id ORDER BY c.date ASC")
        return rows
    },
    async getByEventId(eventId) {
        const [rows] = await db.query("SELECT * FROM event_communication WHERE event_id = ? ORDER BY date ASC", [eventId])
        return rows
    },
    async create(data) {
        const { event_id, channel, activity, date, status } = data
        const [result] = await db.query(
            "INSERT INTO event_communication (event_id, channel, activity, date, status) VALUES (?, ?, ?, ?, ?)",
            [event_id, channel, activity, date, status]
        )
        return result.insertId
    },
    async update(id, data) {
        const { channel, activity, date, status } = data
        const [result] = await db.query(
            "UPDATE event_communication SET channel=?, activity=?, date=?, status=? WHERE id=?",
            [channel, activity, date, status, id]
        )
        return result.affectedRows
    },
    async delete(id) {
        const [result] = await db.query("DELETE FROM event_communication WHERE id = ?", [id])
        return result.affectedRows
    }
}

module.exports = Communication
