const db = require("../config/database");
const Venue = {
    getAll: async () => {
        const [r] = await db.query("SELECT * FROM venues ORDER BY name ASC");
        return r;
    },
    getById: async (id) => {
        const [r] = await db.query("SELECT * FROM venues WHERE id=?", [id]);
        return r[0] || null;
    },
    create: async (d) => {
        const [r] = await db.query(
            "INSERT INTO venues (name,type,location,capacity,description,facilities,status,created_by) VALUES (?,?,?,?,?,?,?,?)",
            [d.name, d.type || 'room', d.location || null, d.capacity || 0, d.description || null,
            d.facilities ? JSON.stringify(d.facilities) : null, d.status || 'available', d.created_by || null]
        );
        return r.insertId;
    },
    update: async (id, d) => {
        await db.query(
            "UPDATE venues SET name=?,type=?,location=?,capacity=?,description=?,facilities=?,status=? WHERE id=?",
            [d.name, d.type, d.location || null, d.capacity || 0, d.description || null,
            d.facilities ? JSON.stringify(d.facilities) : null, d.status, id]
        );
    },
    delete: async (id) => { await db.query("DELETE FROM venues WHERE id=?", [id]); },
    getBookingById: async (id) => {
        const [r] = await db.query(`
            SELECT b.*, v.name AS venue_name, e.owner_id, e.name AS event_name
            FROM event_venue_bookings b
            JOIN venues v ON b.venue_id = v.id
            JOIN events e ON b.event_id = e.id
            WHERE b.id = ?
        `, [id]);
        return r[0] || null;
    },

    // Lấy bookings của venue
    getBookings: async (venueId) => {
        const [r] = await db.query(`
            SELECT b.*, e.name AS event_name
            FROM event_venue_bookings b
            JOIN events e ON b.event_id = e.id
            WHERE b.venue_id = ? ORDER BY b.start_time ASC
        `, [venueId]);
        return r;
    },

    // Booking theo event
    getEventBookings: async (eventId) => {
        const [r] = await db.query(`
            SELECT b.*, v.name AS venue_name, v.capacity AS venue_capacity
            FROM event_venue_bookings b
            JOIN venues v ON b.venue_id = v.id
            WHERE b.event_id = ? ORDER BY b.start_time ASC
        `, [eventId]);
        return r;
    },

    createBooking: async (d) => {
        const [r] = await db.query(
            "INSERT INTO event_venue_bookings (event_id,venue_id,start_time,end_time,note,status) VALUES (?,?,?,?,?,?)",
            [d.event_id, d.venue_id, d.start_time, d.end_time, d.note || null, d.status || 'pending']
        );
        return r.insertId;
    },

    /**
     * Kiểm tra xung đột thời gian: trả về booking đã confirmed trùng khung giờ
     * @param {number} venueId
     * @param {string} startTime
     * @param {string} endTime
     * @param {number|null} excludeId - bỏ qua booking này (dùng khi update)
     */
    checkConflict: async (venueId, startTime, endTime, excludeId = null) => {
        let sql = `
            SELECT b.id, b.start_time, b.end_time, e.name AS event_name
            FROM event_venue_bookings b
            JOIN events e ON b.event_id = e.id
            WHERE b.venue_id = ?
              AND b.status = 'confirmed'
              AND b.start_time < ?
              AND b.end_time > ?
        `;
        const params = [venueId, endTime, startTime];
        if (excludeId) {
            sql += " AND b.id != ?";
            params.push(excludeId);
        }
        const [rows] = await db.query(sql, params);
        return rows[0] || null;
    },

    updateBookingStatus: async (id, status) => {
        await db.query("UPDATE event_venue_bookings SET status=? WHERE id=?", [status, id]);
    },

    deleteBooking: async (id) => {
        await db.query("DELETE FROM event_venue_bookings WHERE id=?", [id]);
    }
};
module.exports = Venue;
