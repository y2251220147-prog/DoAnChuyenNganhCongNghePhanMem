const db = require("../config/database");

const Guest = {
    getAll: async () => {
        const [rows] = await db.query("SELECT * FROM guests ORDER BY id DESC");
        return rows;
    },
    getByEvent: async (eventId) => {
        const [rows] = await db.query(
            "SELECT * FROM guests WHERE event_id = ? ORDER BY id DESC", [eventId]
        );
        return rows;
    },
    findById: async (id) => {
        const [rows] = await db.query("SELECT * FROM guests WHERE id = ?", [id]);
        return rows[0] || null;
    },
    create: async (guest) => {
        const { event_id, name, email, phone, qr_code } = guest;
        const [result] = await db.query(
            "INSERT INTO guests (event_id, name, email, phone, qr_code) VALUES (?, ?, ?, ?, ?)",
            [event_id, name, email, phone || null, qr_code || null]
        );
        return result.insertId;
    },
    delete: async (id) => {
        await db.query("DELETE FROM guests WHERE id = ?", [id]);
    },
    findByEmailAndEvent: async (email, eventId) => {
        const [rows] = await db.query(
            "SELECT id FROM guests WHERE email = ? AND event_id = ?",
            [email, eventId]
        );
        return rows[0] || null;
    },
    findByEmail: async (email) => {
        const [rows] = await db.query(
            `SELECT g.*, 
                e.name   AS event_name,
                e.status AS event_status,
                e.start_date, e.end_date, e.location
             FROM guests g
             LEFT JOIN events e ON e.id = g.event_id
             WHERE g.email = ?
             ORDER BY g.id DESC`,
            [email]
        );
        return rows;
    }
};

module.exports = Guest;
