const db = require("../config/database")

const Evaluation = {
    async getByEventId(eventId) {
        const [rows] = await db.query("SELECT * FROM event_evaluation WHERE event_id = ?", [eventId])
        return rows
    },
    async create(data) {
        const { event_id, metric, target, actual, notes } = data
        const [result] = await db.query(
            "INSERT INTO event_evaluation (event_id, metric, target, actual, notes) VALUES (?, ?, ?, ?, ?)",
            [event_id, metric, target, actual, notes]
        )
        return result.insertId
    },
    async update(id, data) {
        const { metric, target, actual, notes } = data
        const [result] = await db.query(
            "UPDATE event_evaluation SET metric=?, target=?, actual=?, notes=? WHERE id=?",
            [metric, target, actual, notes, id]
        )
        return result.affectedRows
    },
    async delete(id) {
        const [result] = await db.query("DELETE FROM event_evaluation WHERE id = ?", [id])
        return result.affectedRows
    }
}

module.exports = Evaluation
