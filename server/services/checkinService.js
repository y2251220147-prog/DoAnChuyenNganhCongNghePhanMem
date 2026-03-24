const db = require("../config/database");

/**
 * Check-in bằng QR code.
 * QR format: EP-{EVENT_ID}-{NAME_CODE}-{TIMESTAMP}
 * Validate: QR phải thuộc đúng event được chỉ định
 */
const checkin = async (qr_code, event_id) => {
    if (!qr_code || !qr_code.trim())
        throw { status: 400, message: "QR code is required" };

    const [rows] = await db.query(
        "SELECT g.*, e.name as event_name FROM guests g JOIN events e ON g.event_id = e.id WHERE g.qr_code = ?",
        [qr_code.trim()]
    );

    if (!rows || rows.length === 0)
        throw { status: 404, message: "Guest not found. Invalid QR code." };

    const guest = rows[0];

    // Nếu có truyền event_id thì validate đúng sự kiện
    if (event_id && String(guest.event_id) !== String(event_id)) {
        throw {
            status: 422,
            message: `This QR code is for event "${guest.event_name}", not the selected event. Please scan at the correct event.`
        };
    }

    if (guest.checked_in)
        throw { status: 409, message: `${guest.name} has already checked in to "${guest.event_name}".` };

    await db.query(
        "UPDATE guests SET checked_in = 1 WHERE qr_code = ?",
        [qr_code.trim()]
    );

    return {
        guest: {
            id: guest.id,
            name: guest.name,
            email: guest.email,
            event_id: guest.event_id,
            event_name: guest.event_name,
        }
    };
};

const getCheckinStats = async (eventId) => {
    const [rows] = await db.query(
        "SELECT COUNT(*) as total, SUM(checked_in) as checked_in FROM guests WHERE event_id = ?",
        [eventId]
    );
    const { total, checked_in } = rows[0];
    return {
        total: Number(total) || 0,
        checkedIn: Number(checked_in) || 0,
        notCheckedIn: (Number(total) || 0) - (Number(checked_in) || 0),
        percentage: total > 0 ? Math.round((checked_in / total) * 100) : 0,
    };
};

// Lấy danh sách guest đã/chưa checkin của 1 event
const getCheckinList = async (eventId) => {
    const [rows] = await db.query(
        "SELECT * FROM guests WHERE event_id = ? ORDER BY checked_in DESC, name ASC",
        [eventId]
    );
    return rows;
};

module.exports = { checkin, getCheckinStats, getCheckinList };
