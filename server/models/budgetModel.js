const db = require("../config/database");

const Budget = {
    getAll: async () => {
        const [rows] = await db.query("SELECT * FROM event_budget ORDER BY id DESC");
        return rows;
    },
    getByEvent: async (eventId) => {
        const [rows] = await db.query(
            "SELECT * FROM event_budget WHERE event_id = ? ORDER BY id DESC",
            [eventId]
        );
        return rows;
    },
    // FIX: thêm findById để validate trước update/delete
    findById: async (id) => {
        const [rows] = await db.query("SELECT * FROM event_budget WHERE id = ?", [id]);
        return rows[0] || null;
    },
    create: async (data) => {
        const { event_id, item, cost, note } = data;
        const [result] = await db.query(
            "INSERT INTO event_budget (event_id, item, cost, note) VALUES (?, ?, ?, ?)",
            [event_id, item, cost, note || null]
        );
        return result.insertId;
    },
    update: async (id, data) => {
        const { item, cost, note } = data;
        await db.query(
            "UPDATE event_budget SET item=?, cost=?, note=? WHERE id=?",
            [item, cost, note || null, id]
        );
    },
    delete: async (id) => {
        await db.query("DELETE FROM event_budget WHERE id = ?", [id]);
    }
};

module.exports = Budget;
