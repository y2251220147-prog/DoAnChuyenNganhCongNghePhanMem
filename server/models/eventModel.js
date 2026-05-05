const db = require("../config/database");

const Event = {

    async getAll() {
        const [rows] = await db.query(`
            SELECT e.*, u.name AS owner_name, a.name AS approver_name,
                   org.name AS organizer_name,
                   v.location AS detailed_location,
                   d.name AS department_name, d.manager_id AS dept_manager_id,
                   (SELECT COUNT(*) FROM attendees att WHERE att.event_id = e.id) AS registered_count
            FROM events e
            LEFT JOIN users u   ON e.owner_id     = u.id
            LEFT JOIN users a   ON e.approved_by  = a.id
            LEFT JOIN users org ON e.organizer_id = org.id
            LEFT JOIN venues v  ON e.venue_id     = v.id
            LEFT JOIN departments d ON e.department_id = d.id
            ORDER BY e.created_at DESC
        `);
        return rows;
    },

    async getById(id) {
        const [rows] = await db.query(`
            SELECT e.*, u.name AS owner_name, a.name AS approver_name,
                   org.name AS organizer_name,
                   v.location AS detailed_location,
                   d.name AS department_name, d.manager_id AS dept_manager_id,
                   (SELECT COUNT(*) FROM attendees att WHERE att.event_id = e.id) AS registered_count
            FROM events e
            LEFT JOIN users u   ON e.owner_id     = u.id
            LEFT JOIN users a   ON e.approved_by  = a.id
            LEFT JOIN users org ON e.organizer_id = org.id
            LEFT JOIN venues v  ON e.venue_id     = v.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE e.id = ?
        `, [id]);
        return rows[0] || null;
    },

    async create(data) {
        const {
            name, description, event_type, owner_id,
            start_date, end_date,
            venue_type, location, capacity,
            total_budget, status,
            organizer_id, department_id, venue_id
        } = data;
        const [result] = await db.query(`
            INSERT INTO events
                (name, description, event_type, owner_id, start_date, end_date,
                 venue_type, location, capacity, total_budget, status,
                 organizer_id, department_id, venue_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, description || null, event_type || null, owner_id || null,
            start_date, end_date,
            venue_type || "offline", location || null, capacity || null,
            total_budget || 0, status || "draft",
            organizer_id || null, department_id || null, venue_id || null
        ]);
        return result.insertId;
    },

    async update(id, data) {
        const {
            name, description, event_type, owner_id,
            start_date, end_date,
            venue_type, location, capacity,
            total_budget, status,
            organizer_id, department_id, venue_id
        } = data;
        await db.query(`
            UPDATE events
            SET name=?, description=?, event_type=?, owner_id=?,
                start_date=?, end_date=?,
                venue_type=?, location=?, capacity=?,
                total_budget=?, status=?,
                organizer_id=?, department_id=?, venue_id=?
            WHERE id=?
        `, [
            name, description, event_type, owner_id,
            start_date, end_date,
            venue_type, location, capacity,
            total_budget, status,
            organizer_id, department_id, venue_id, id
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
    },

    // ── Server-side Search với LIKE + Pagination ───────────────
    async search({ keyword = "", status = "", event_type = "", date_from = "", date_to = "", page = 1, limit = 10 }) {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const params = [];
        const conditions = [];

        if (keyword) {
            conditions.push("(e.name LIKE ? OR e.description LIKE ? OR e.location LIKE ?)");
            const kw = `%${keyword}%`;
            params.push(kw, kw, kw);
        }
        if (status) { conditions.push("e.status = ?"); params.push(status); }
        if (event_type) { conditions.push("e.event_type = ?"); params.push(event_type); }
        if (date_from) { conditions.push("e.start_date >= ?"); params.push(date_from); }
        if (date_to) { conditions.push("e.end_date <= ?"); params.push(date_to + " 23:59:59"); }

        const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

        const [countRows] = await db.query(`
            SELECT COUNT(*) AS total FROM events e ${where}
        `, params);
        const total = countRows[0].total;

        const [rows] = await db.query(`
            SELECT e.*, u.name AS owner_name, a.name AS approver_name,
                   org.name AS organizer_name,
                   v.location AS detailed_location,
                   (SELECT COUNT(*) FROM attendees att WHERE att.event_id = e.id) AS registered_count
            FROM events e
            LEFT JOIN users u   ON e.owner_id     = u.id
            LEFT JOIN users a   ON e.approved_by  = a.id
            LEFT JOIN users org ON e.organizer_id = org.id
            LEFT JOIN venues v  ON e.venue_id     = v.id
            ${where}
            ORDER BY e.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);

        return {
            data: rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        };
    }
};

module.exports = Event;
