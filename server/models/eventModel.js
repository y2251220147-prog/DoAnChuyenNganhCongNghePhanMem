const db = require("../config/database");

const Event = {

    async getAll() {
        const [rows] = await db.query(`
            SELECT e.*, u.name AS owner_name, a.name AS approver_name, 
                   (SELECT GROUP_CONCAT(d.name SEPARATOR ', ') FROM event_departments ed JOIN departments d ON ed.department_id = d.id WHERE ed.event_id = e.id) AS department_name,
                   (SELECT COUNT(*) FROM attendees att WHERE att.event_id = e.id) AS registered_count
            FROM events e
            LEFT JOIN users u ON e.owner_id = u.id
            LEFT JOIN users a ON e.approved_by = a.id
            ORDER BY e.created_at DESC
        `);
        return rows;
    },

    async getById(id) {
        const [rows] = await db.query(`
            SELECT e.*, u.name AS owner_name, a.name AS approver_name,
                   (SELECT GROUP_CONCAT(d.name SEPARATOR ', ') FROM event_departments ed JOIN departments d ON ed.department_id = d.id WHERE ed.event_id = e.id) AS department_name,
                   (SELECT COUNT(*) FROM attendees att WHERE att.event_id = e.id) AS registered_count
            FROM events e
            LEFT JOIN users u ON e.owner_id = u.id
            LEFT JOIN users a ON e.approved_by = a.id
            WHERE e.id = ?
        `, [id]);
        
        if (rows.length === 0) return null;
        
        const event = rows[0];
        
        // Fetch departments as array
        const [depts] = await db.query(`
            SELECT d.id, d.name 
            FROM event_departments ed
            JOIN departments d ON ed.department_id = d.id
            WHERE ed.event_id = ?
        `, [id]);
        
        event.departments = depts;
        event.department_ids = depts.map(d => d.id);
        
        return event;
    },

    async syncAttendees(eventId) {
        // Find all users in the assigned departments
        const [users] = await db.query(`
            SELECT u.id, u.name, u.email 
            FROM users u
            JOIN event_departments ed ON u.department_id = ed.department_id
            WHERE ed.event_id = ?
        `, [eventId]);

        if (users.length === 0) return;

        // Insert them into attendees table if they don't exist
        for (const user of users) {
            await db.query(`
                INSERT IGNORE INTO attendees (event_id, user_id, name, email, attendee_type)
                VALUES (?, ?, ?, ?, 'internal')
            `, [eventId, user.id, user.name, user.email]);
        }
    },

    async create(data) {
        const {
            name, description, event_type, owner_id,
            start_date, end_date,
            venue_type, location, capacity,
            total_budget, status, department_ids
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
        
        const eventId = result.insertId;
        
        if (department_ids && department_ids.length > 0) {
            const values = department_ids.map(dId => [eventId, dId]);
            await db.query("INSERT INTO event_departments (event_id, department_id) VALUES ?", [values]);
            await this.syncAttendees(eventId);
        }
        
        return eventId;
    },

    async update(id, data) {
        const {
            name, description, event_type, owner_id,
            start_date, end_date,
            venue_type, location, capacity,
            total_budget, status, department_ids
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
        
        if (department_ids !== undefined) {
            await db.query("DELETE FROM event_departments WHERE event_id = ?", [id]);
            if (department_ids.length > 0) {
                const values = department_ids.map(dId => [id, dId]);
                await db.query("INSERT INTO event_departments (event_id, department_id) VALUES ?", [values]);
                await this.syncAttendees(id);
            }
        }
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
