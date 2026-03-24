const db = require("../config/database");

const Timeline = {

    async getAll() {
        const [rows] = await db.query(
            "SELECT * FROM event_timeline ORDER BY start_time ASC"
        );
        return rows;
    },

    async getByEvent(eventId) {
        const [rows] = await db.query(
            "SELECT * FROM event_timeline WHERE event_id = ? ORDER BY start_time ASC",
            [eventId]
        );
        return rows;
    },

    async create(data) {
        const { event_id, title, start_time, end_time, description } = data;
        const [result] = await db.query(
            "INSERT INTO event_timeline (event_id, title, start_time, end_time, description) VALUES (?, ?, ?, ?, ?)",
            [event_id, title, start_time, end_time || null, description || null]
        );
        return result.insertId;
    },

    async update(id, data) {
        const { title, start_time, end_time, description } = data;
        await db.query(
            "UPDATE event_timeline SET title = ?, start_time = ?, end_time = ?, description = ? WHERE id = ?",
            [title, start_time, end_time || null, description || null, id]
        );
    },

    async delete(id) {
        await db.query("DELETE FROM event_timeline WHERE id = ?", [id]);
    }

};

module.exports = Timeline;
