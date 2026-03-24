const db = require("../config/database");

const Deadline = {

    async getByEvent(eventId) {
        const [rows] = await db.query(
            "SELECT * FROM event_deadlines WHERE event_id = ? ORDER BY due_date ASC",
            [eventId]
        );
        return rows;
    },

    async create(data) {
        const { event_id, title, due_date, note } = data;
        const [result] = await db.query(
            "INSERT INTO event_deadlines (event_id, title, due_date, note) VALUES (?, ?, ?, ?)",
            [event_id, title, due_date, note || null]
        );
        return result.insertId;
    },

    async toggleDone(id, done) {
        await db.query("UPDATE event_deadlines SET done=? WHERE id=?", [done ? 1 : 0, id]);
    },

    async delete(id) {
        await db.query("DELETE FROM event_deadlines WHERE id=?", [id]);
    }
};

module.exports = Deadline;
