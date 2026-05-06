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
    
    // Obsolete methods removed to prevent crashes
    getBookingById: async (id) => { return null; },
    getBookings: async (venueId) => { return []; },
    getEventBookings: async (eventId) => { return []; },
    createBooking: async (d) => { return null; },
    checkConflict: async (venueId, startTime, endTime, excludeId = null) => { return null; },
    updateBookingStatus: async (id, status) => { },
    deleteBooking: async (id) => { }
};
module.exports = Venue;
