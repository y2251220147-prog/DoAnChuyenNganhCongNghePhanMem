const db = require("../config/database");

const Deadline = {

    async getByEvent(eventId) {
        const [rows] = await db.query(`
            SELECT ed.*, u.name AS assigned_name
            FROM event_deadlines ed
            LEFT JOIN users u ON ed.assigned_to = u.id
            WHERE ed.event_id = ? 
            ORDER BY ed.due_date ASC
        `, [eventId]);
        return rows;
    },

    async create(data) {
        const { event_id, title, due_date, note, assigned_to } = data;
        const [result] = await db.query(
            "INSERT INTO event_deadlines (event_id, title, due_date, note, assigned_to) VALUES (?, ?, ?, ?, ?)",
            [event_id, title, due_date, note || null, assigned_to || null]
        );
        return result.insertId;
    },

    async updateStatus(id, status, note) {
        if (note !== undefined) {
            await db.query("UPDATE event_deadlines SET status=?, note=? WHERE id=?", [status, note, id]);
        } else {
            await db.query("UPDATE event_deadlines SET status=? WHERE id=?", [status, id]);
        }
    },

    async delete(id) {
        await db.query("DELETE FROM event_deadlines WHERE id=?", [id]);
    }
};

module.exports = Deadline;
