const db = require("../config/database");

const Event = {

    async getAll() {
        const [rows] = await db.query(`
            SELECT e.*, u.name AS owner_name, a.name AS approver_name
            FROM events e
            LEFT JOIN users u ON e.owner_id = u.id
            LEFT JOIN users a ON e.approved_by = a.id
            ORDER BY e.created_at DESC
        `);
        return rows;
    },

    async getById(id) {
        const [rows] = await db.query(`
            SELECT e.*, u.name AS owner_name, a.name AS approver_name
            FROM events e
            LEFT JOIN users u ON e.owner_id = u.id
            LEFT JOIN users a ON e.approved_by = a.id
            WHERE e.id = ?
        `, [id]);
        return rows[0] || null;
    },

    async getAvailableForUser(userId) {
        const [rows] = await db.query(`
            SELECT e.*, u.name AS owner_name
            FROM events e
            LEFT JOIN users u ON e.owner_id = u.id
            WHERE e.status IN ('approved', 'running')
              AND e.id NOT IN (
                  SELECT event_id FROM attendees WHERE user_id = ?
              )
            ORDER BY e.start_date ASC
        `, [userId]);
        return rows;
    },

    async getRegisteredForUser(userId) {
        const [rows] = await db.query(`
            SELECT e.*, u.name AS owner_name, a.checked_in
            FROM events e
            JOIN attendees a ON e.id = a.event_id
            LEFT JOIN users u ON e.owner_id = u.id
            WHERE a.user_id = ?
            ORDER BY e.start_date ASC
        `, [userId]);
        return rows;
    },

    async create(data) {
        const {
            name, description, event_type, owner_id,
            start_date, end_date,
            venue_type, location, capacity,
            total_budget, status
        } = data;
        const [result] = await db.query(`
            INSERT INTO events
                (name, description, event_type, owner_id, start_date, end_date,
                 venue_type, location, capacity, total_budget, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, description || null, event_type || null, owner_id || null,
            start_date, end_date,
            venue_type || "offline", location || null, capacity || null,
            total_budget || 0, status || "draft"
        ]);
        return result.insertId;
    },

    async update(id, data) {
        const {
            name, description, event_type, owner_id,
            start_date, end_date,
            venue_type, location, capacity,
            total_budget, status
        } = data;
        await db.query(`
            UPDATE events
            SET name=?, description=?, event_type=?, owner_id=?,
                start_date=?, end_date=?,
                venue_type=?, location=?, capacity=?,
                total_budget=?, status=?
            WHERE id=?
        `, [
            name, description, event_type, owner_id,
            start_date, end_date,
            venue_type, location, capacity,
            total_budget, status, id
        ]);
    },

    async approve(id, approverId) {
        await db.query(
            "UPDATE events SET status='approved', approved_by=?, approved_at=NOW() WHERE id=?",
            [approverId, id]
        );
    },

    async changeStatus(id, status) {
        await db.query("UPDATE events SET status=? WHERE id=?", [status, id]);
    },

    async delete(id) {
        await db.query("DELETE FROM events WHERE id = ?", [id]);
    }
};

module.exports = Event;
