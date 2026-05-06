const db = require("../config/database");
const Attendee = {
    getAll: async () => {
        const [r] = await db.query(`
            SELECT a.*, e.name AS event_name, u.role AS user_role
            FROM attendees a
            LEFT JOIN events e ON a.event_id = e.id
            LEFT JOIN users u  ON a.user_id  = u.id
            ORDER BY a.created_at DESC
        `);
        return r;
    },
    getByUser: async (userId) => {
        const [r] = await db.query(`
            SELECT a.*, e.name AS event_name, e.start_date, e.end_date, e.location, e.status AS event_status
            FROM attendees a
            JOIN events e ON a.event_id = e.id
            WHERE a.user_id = ?
            ORDER BY e.start_date ASC
        `, [userId]);
        return r;
    },
    getByEvent: async (eventId) => {
        const [r] = await db.query(`
            SELECT a.*, u.role AS user_role, d.name AS department_name
            FROM attendees a 
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE a.event_id=? ORDER BY a.checked_in DESC, a.name ASC
        `, [eventId]);
        return r;
    },
    findById: async (id) => {
        const [r] = await db.query(
            "SELECT a.*, e.name AS event_name FROM attendees a LEFT JOIN events e ON a.event_id=e.id WHERE a.id=?",
            [id]
        );
        return r[0] || null;
    },
    findByQR: async (qr) => {
        const [r] = await db.query(
            "SELECT a.*, e.name AS event_name FROM attendees a JOIN events e ON a.event_id=e.id WHERE a.qr_code=?",
            [qr]
        );
        return r[0] || null;
    },
    findByUserAndEvent: async (userId, eventId) => {
        const [r] = await db.query(
            "SELECT id FROM attendees WHERE user_id=? AND event_id=?", [userId, eventId]
        );
        return r[0] || null;
    },
    findByEmailAndEvent: async (email, eventId) => {
        const [r] = await db.query(
            "SELECT id FROM attendees WHERE email=? AND event_id=? AND user_id IS NULL", [email, eventId]
        );
        return r[0] || null;
    },
    create: async (d) => {
        const [r] = await db.query(`
            INSERT INTO attendees (event_id,user_id,name,email,phone,attendee_type,qr_code,registered_by)
            VALUES (?,?,?,?,?,?,?,?)
        `, [d.event_id, d.user_id || null, d.name, d.email, d.phone || null,
        d.attendee_type || (d.user_id ? 'internal' : 'external'), d.qr_code || null, d.registered_by || null]);
        return r.insertId;
    },
    checkin: async (id) => {
        await db.query("UPDATE attendees SET checked_in=1, checked_in_at=NOW() WHERE id=?", [id]);
    },
    delete: async (id) => { await db.query("DELETE FROM attendees WHERE id=?", [id]); },
    getStats: async (eventId) => {
        const [r] = await db.query(`
            SELECT COUNT(*) AS total, SUM(checked_in) AS checked_in,
                   SUM(attendee_type='internal') AS internal_count,
                   SUM(attendee_type='external') AS external_count,
                   SUM(attendee_type='internal' AND checked_in=1) AS internal_checkin,
                   SUM(attendee_type='external' AND checked_in=1) AS external_checkin
            FROM attendees WHERE event_id=?
        `, [eventId]);
        const x = r[0];
        const total = Number(x.total) || 0, ci = Number(x.checked_in) || 0;
        return {
            total, checkedIn: ci, notCheckedIn: total - ci, percentage: total > 0 ? Math.round(ci / total * 100) : 0,
            internalCount: Number(x.internal_count) || 0, externalCount: Number(x.external_count) || 0,
            internalCheckin: Number(x.internal_checkin) || 0, externalCheckin: Number(x.external_checkin) || 0
        };
    },
    lookup: async (email) => {
        const [rows] = await db.query(`
            SELECT a.*, e.name AS event_name, e.start_date, e.end_date, e.location, e.status AS event_status
            FROM attendees a
            JOIN events e ON a.event_id = e.id
            WHERE a.email = ?
            ORDER BY e.start_date DESC
        `, [email]);
        return rows;
    }
};
module.exports = Attendee;

