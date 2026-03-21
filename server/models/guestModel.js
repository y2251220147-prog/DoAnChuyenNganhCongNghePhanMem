const db = require("../config/database");

const Guest = {

    getAll: async () => {
        const [rows] = await db.query("SELECT * FROM guests ORDER BY id DESC");
        return rows;
    },

    getByEvent: async (eventId) => {
        const [rows] = await db.query(
            "SELECT * FROM guests WHERE event_id = ? ORDER BY id DESC",
            [eventId]
        );
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query("SELECT * FROM guests WHERE id = ?", [id]);
        return rows[0] || null;
    },

    create: async (guest) => {
        const { event_id, name, email, phone } = guest;
        const [result] = await db.query(
            "INSERT INTO guests (event_id, name, email, phone) VALUES (?, ?, ?, ?)",
            [event_id, name, email, phone || null]
        );
        return result.insertId;
    },

    delete: async (id) => {
        await db.query("DELETE FROM guests WHERE id = ?", [id]);
    }

};

module.exports = Guest;
