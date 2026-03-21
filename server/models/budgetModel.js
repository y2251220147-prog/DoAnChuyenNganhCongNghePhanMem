const db = require("../config/database")

const Budget = {
    async getAll() {
        const [rows] = await db.query(
            "SELECT b.*, e.name as event_name FROM event_budget b JOIN events e ON b.event_id = e.id ORDER BY b.id DESC"
        )
        return rows
    },
    async getByEventId(eventId) {
        const [rows] = await db.query(
            "SELECT * FROM event_budget WHERE event_id = ?",
            [eventId]
        )
        return rows
    },
    async create(data) {
        const { event_id, item, category, cost, note } = data
        const [result] = await db.query(
            "INSERT INTO event_budget(event_id, item, category, cost, note) VALUES(?,?,?,?,?)",
            [event_id, item, category || "Other", cost, note]
        )
        return result.insertId
    },
    async update(id, data) {
        const { item, category, cost, note } = data
        const [result] = await db.query(
            "UPDATE event_budget SET item=?, category=?, cost=?, note=? WHERE id=?",
            [item, category, cost, note, id]
        )
        return result.affectedRows
    },
    async delete(id) {
        const [result] = await db.query("DELETE FROM event_budget WHERE id=?", [id])
        return result.affectedRows
    }
}

module.exports = Budget