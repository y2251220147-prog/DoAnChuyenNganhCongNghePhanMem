const db = require("../config/database");
const { verifyQR } = require("./qrService");

/**
 * Check-in bằng QR code.
 * Hỗ trợ cả hai bảng: guests (khách ngoài) và attendees (nhân viên nội bộ).
 * QR format: EP-{EVENT_ID}-{NAME_CODE}-{TIMESTAMP}-{HMAC}
 */
const checkin = async (qr_code, event_id) => {
    if (!qr_code || !qr_code.trim())
        throw { status: 400, message: "QR code is required" };

    const qr = qr_code.trim();

    // 0. Xác minh chữ ký QR do server tạo (chống giả mã)
    if (!verifyQR(qr))
        throw { status: 400, message: "Mã QR không hợp lệ hoặc đã bị sửa đổi." };

    // 1. Tìm trong bảng attendees (nhân viên nội bộ)
    const [attRows] = await db.query(
        `SELECT a.*, e.name AS event_name, e.status AS event_status, 'attendee' AS source
         FROM attendees a
         JOIN events e ON a.event_id = e.id
         WHERE a.qr_code = ?`,
        [qr]
    );

    if (attRows && attRows.length > 0) {
        const person = attRows[0];

        if (event_id && String(person.event_id) !== String(event_id)) {
            throw {
                status: 422,
                message: `Mã QR này thuộc sự kiện "${person.event_name}", không phải sự kiện đang chọn.`
            };
        }

        if (person.checked_in)
            throw { status: 409, message: `${person.name} đã check-in sự kiện "${person.event_name}" rồi.` };

        if (!['approved', 'running'].includes(person.event_status))
            throw { status: 403, message: `Sự kiện "${person.event_name}" đã kết thúc hoặc chưa mở check-in (trạng thái: ${person.event_status}).` };

        await db.query(
            "UPDATE attendees SET checked_in=1, checked_in_at=NOW() WHERE qr_code=?",
            [qr]
        );

        return {
            source: "attendee",
            person: {
                id: person.id,
                name: person.name,
                email: person.email,
                attendee_type: person.attendee_type,
                event_id: person.event_id,
                event_name: person.event_name,
            }
        };
    }

    // 2. Tìm trong bảng guests (khách ngoài)
    const [guestRows] = await db.query(
        `SELECT g.*, e.name AS event_name, e.status AS event_status, 'guest' AS source
         FROM guests g
         JOIN events e ON g.event_id = e.id
         WHERE g.qr_code = ?`,
        [qr]
    );

    if (!guestRows || guestRows.length === 0)
        throw { status: 404, message: "Không tìm thấy người tham dự. Mã QR không hợp lệ." };

    const guest = guestRows[0];

    if (event_id && String(guest.event_id) !== String(event_id)) {
        throw {
            status: 422,
            message: `Mã QR này thuộc sự kiện "${guest.event_name}", không phải sự kiện đang chọn.`
        };
    }

    if (guest.checked_in)
        throw { status: 409, message: `${guest.name} đã check-in sự kiện "${guest.event_name}" rồi.` };

    if (!['approved', 'running'].includes(guest.event_status))
        throw { status: 403, message: `Sự kiện "${guest.event_name}" đã kết thúc hoặc chưa mở check-in (trạng thái: ${guest.event_status}).` };

    await db.query(
        "UPDATE guests SET checked_in=1 WHERE qr_code=?",
        [qr]
    );

    return {
        source: "guest",
        person: {
            id: guest.id,
            name: guest.name,
            email: guest.email,
            event_id: guest.event_id,
            event_name: guest.event_name,
        }
    };
};

/**
 * Thống kê check-in của sự kiện (gộp cả guests lẫn attendees).
 */
const getCheckinStats = async (eventId) => {
    const [[att]] = await db.query(
        `SELECT COUNT(*) AS total, COALESCE(SUM(checked_in), 0) AS checked_in
         FROM attendees WHERE event_id = ?`,
        [eventId]
    );
    const [[gst]] = await db.query(
        `SELECT COUNT(*) AS total, COALESCE(SUM(checked_in), 0) AS checked_in
         FROM guests WHERE event_id = ?`,
        [eventId]
    );

    const total     = (Number(att.total) || 0) + (Number(gst.total) || 0);
    const checkedIn = (Number(att.checked_in) || 0) + (Number(gst.checked_in) || 0);

    return {
        total,
        checkedIn,
        notCheckedIn: total - checkedIn,
        percentage: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
        breakdown: {
            attendees: { total: Number(att.total) || 0, checkedIn: Number(att.checked_in) || 0 },
            guests:    { total: Number(gst.total) || 0, checkedIn: Number(gst.checked_in) || 0 },
        }
    };
};

/**
 * Danh sách check-in (gộp cả guests lẫn attendees).
 */
const getCheckinList = async (eventId) => {
    const [attRows] = await db.query(
        `SELECT id, name, email, attendee_type AS type, checked_in, checked_in_at, 'attendee' AS source
         FROM attendees WHERE event_id = ?`,
        [eventId]
    );
    const [gstRows] = await db.query(
        `SELECT id, name, email, 'external' AS type, checked_in, NULL AS checked_in_at, 'guest' AS source
         FROM guests WHERE event_id = ?`,
        [eventId]
    );

    return [...attRows, ...gstRows].sort((a, b) => {
        // Đã check-in lên trước, sau đó sort tên
        if (b.checked_in !== a.checked_in) return b.checked_in - a.checked_in;
        return (a.name || "").localeCompare(b.name || "", "vi");
    });
};

module.exports = { checkin, getCheckinStats, getCheckinList };
