const db = require("../config/database");
const { verifyQR } = require("./qrService");

/**
 * Check-in bằng QR code.
 * Sử dụng duy nhất bảng attendees (bao gồm cả nhân viên nội bộ và khách ngoài).
 */
const checkin = async (qr_code, event_id) => {
    if (!qr_code || !qr_code.trim())
        throw { status: 400, message: "QR code is required" };

    const qr = qr_code.trim();

    // 0. Xác minh chữ ký QR do server tạo
    if (!verifyQR(qr))
        throw { status: 400, message: "Mã QR không hợp lệ hoặc đã bị sửa đổi." };

    // 1. Tìm trong bảng attendees
    const [attRows] = await db.query(
        `SELECT a.*, e.name AS event_name, e.status AS event_status
         FROM attendees a
         JOIN events e ON a.event_id = e.id
         WHERE a.qr_code = ?`,
        [qr]
    );

    if (!attRows || attRows.length === 0)
        throw { status: 404, message: "Không tìm thấy người tham dự. Mã QR không hợp lệ." };

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
        throw { status: 403, message: `Sự kiện "${person.event_name}" chưa mở check-in (trạng thái: ${person.event_status}).` };

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
};

/**
 * Thống kê check-in của sự kiện.
 */
const getCheckinStats = async (eventId) => {
    const [[att]] = await db.query(
        `SELECT COUNT(*) AS total, COALESCE(SUM(checked_in), 0) AS checked_in
         FROM attendees WHERE event_id = ?`,
        [eventId]
    );

    const total     = Number(att.total) || 0;
    const checkedIn = Number(att.checked_in) || 0;

    return {
        total,
        checkedIn,
        notCheckedIn: total - checkedIn,
        percentage: total > 0 ? Math.round((checkedIn / total) * 100) : 0
    };
};

/**
 * Danh sách check-in.
 */
const getCheckinList = async (eventId) => {
    const [rows] = await db.query(
        `SELECT id, name, email, attendee_type AS type, checked_in, checked_in_at
         FROM attendees WHERE event_id = ?`,
        [eventId]
    );

    return rows.sort((a, b) => {
        if (b.checked_in !== a.checked_in) return b.checked_in - a.checked_in;
        return (a.name || "").localeCompare(b.name || "", "vi");
    });
};

module.exports = { checkin, getCheckinStats, getCheckinList };


module.exports = { checkin, getCheckinStats, getCheckinList };
