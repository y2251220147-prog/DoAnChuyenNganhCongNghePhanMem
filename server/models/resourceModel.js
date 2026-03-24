const db = require("../config/database");
const Resource = {
    getAll: async () => {
        const [r] = await db.query("SELECT * FROM resources ORDER BY category, name");
        return r;
    },
    getById: async (id) => {
        const [r] = await db.query("SELECT * FROM resources WHERE id=?", [id]);
        return r[0] || null;
    },
    create: async (d) => {
        const [r] = await db.query(
            "INSERT INTO resources (name,category,quantity,unit,description,status) VALUES (?,?,?,?,?,?)",
            [d.name, d.category || null, d.quantity || 1, d.unit || null, d.description || null, d.status || 'available']
        );
        return r.insertId;
    },
    update: async (id, d) => {
        await db.query(
            "UPDATE resources SET name=?,category=?,quantity=?,unit=?,description=?,status=? WHERE id=?",
            [d.name, d.category || null, d.quantity || 1, d.unit || null, d.description || null, d.status, id]
        );
    },
    delete: async (id) => { await db.query("DELETE FROM resources WHERE id=?", [id]); },

    getEventBookings: async (eventId) => {
        const [r] = await db.query(`
            SELECT b.*, res.name AS resource_name, res.category, res.unit
            FROM event_resource_bookings b
            JOIN resources res ON b.resource_id = res.id
            WHERE b.event_id = ?
        `, [eventId]);
        return r;
    },
    createBooking: async (d) => {
        const [r] = await db.query(
            "INSERT INTO event_resource_bookings (event_id,resource_id,quantity,note,status) VALUES (?,?,?,?,?)",
            [d.event_id, d.resource_id, d.quantity || 1, d.note || null, d.status || 'pending']
        );
        return r.insertId;
    },
    updateBookingStatus: async (id, status) => {
        await db.query("UPDATE event_resource_bookings SET status=? WHERE id=?", [status, id]);
    },
    deleteBooking: async (id) => {
        await db.query("DELETE FROM event_resource_bookings WHERE id=?", [id]);
    }
};
module.exports = Resource;
