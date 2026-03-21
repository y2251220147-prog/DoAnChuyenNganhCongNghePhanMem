const db = require("../config/database")

const Event = {

    async getAll() {
        const [rows] = await db.query(
            "SELECT * FROM events ORDER BY date DESC, start_time DESC"
        )
        return rows
    },

    async getById(id) {
        const [rows] = await db.query(
            "SELECT * FROM events WHERE id = ?",
            [id]
        )
        return rows[0]
    },

    async create(data) {
        const { name, date, start_time, location, description, capacity, organizer_id, goal, event_type, theme, message, design_notes, contingency_plans } = data
        
        // Generate Unique 8-character code
        const event_code = Math.random().toString(36).substring(2, 10).toUpperCase();
        
        // Generate QR URL pointing to the event detail page (Frontend URL)
        const qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=EVENT-${event_code}`;

        const [result] = await db.query(
            `INSERT INTO events (name, date, start_time, location, description, capacity, organizer_id, goal, event_type, theme, message, design_notes, contingency_plans, event_code, qr_code_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name || null, date || null, start_time || null, location || null, description || null, capacity || null, organizer_id || null, goal || null, event_type || null, theme || null, message || null, design_notes || null, contingency_plans || null, event_code, qr_code_url]
        )
        return result.insertId
    },

    async update(id, data) {
        const { name, date, start_time, location, description, capacity, status, goal, event_type, theme, message, design_notes, contingency_plans } = data
        const [result] = await db.query(
            `UPDATE events SET name=?, date=?, start_time=?, location=?, description=?, capacity=?, status=?, 
             goal=?, event_type=?, theme=?, message=?, design_notes=?, contingency_plans=? WHERE id=?`,
            [name, date, start_time, location, description, capacity, status, goal, event_type, theme, message, design_notes, contingency_plans, id]
        )
        return result.affectedRows
    },

    async delete(id) {
        const [result] = await db.query(
            "DELETE FROM events WHERE id=?",
            [id]
        )
        return result.affectedRows
    }

}

module.exports = Event