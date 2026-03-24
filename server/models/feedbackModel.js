const db = require("../config/database");

const Feedback = {
    getAll: async () => {
        const [rows] = await db.query(
            "SELECT f.*, e.name as event_name FROM feedback f LEFT JOIN events e ON f.event_id = e.id ORDER BY f.created_at DESC"
        );
        return rows;
    },
    getByEvent: async (eventId) => {
        const [rows] = await db.query(
            "SELECT * FROM feedback WHERE event_id = ? ORDER BY created_at DESC",
            [eventId]
        );
        return rows;
    },
    create: async ({ event_id, name, email, rating, message }) => {
        const [result] = await db.query(
            "INSERT INTO feedback (event_id, name, email, rating, message) VALUES (?, ?, ?, ?, ?)",
            [event_id || null, name || null, email || null, rating || 5, message]
        );
        return result.insertId;
    },
    delete: async (id) => {
        await db.query("DELETE FROM feedback WHERE id = ?", [id]);
    }
};

module.exports = Feedback;
