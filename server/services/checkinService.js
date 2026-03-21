// const db = require("../config/database");

// /**
//  * Xử lý check-in bằng QR code
//  * - Tìm khách theo qr_code
//  * - Kiểm tra đã check-in chưa
//  * - Cập nhật trạng thái checked_in = 1
//  */
// const checkin = async (qr_code) => {
//     if (!qr_code || qr_code.trim() === "") {
//         throw { status: 400, message: "qr_code is required" };
//     }

//     const [rows] = await db.query(
//         "SELECT * FROM guests WHERE qr_code = ?",
//         [qr_code.trim()]
//     );

//     if (!rows || rows.length === 0) {
//         throw { status: 404, message: "Guest not found. Invalid QR code." };
//     }

//     const guest = rows[0];

//     if (guest.checked_in) {
//         throw { status: 400, message: `${guest.name} has already checked in.` };
//     }

//     await db.query(
//         "UPDATE guests SET checked_in = 1 WHERE qr_code = ?",
//         [qr_code.trim()]
//     );

//     return {
//         guest: {
//             id: guest.id,
//             name: guest.name,
//             email: guest.email,
//             event_id: guest.event_id,
//         },
//     };
// };

// /**
//  * Lấy thống kê check-in theo sự kiện
//  */
// const getCheckinStats = async (eventId) => {
//     const [rows] = await db.query(
//         "SELECT COUNT(*) as total, SUM(checked_in) as checked_in FROM guests WHERE event_id = ?",
//         [eventId]
//     );
//     const { total, checked_in } = rows[0];
//     return {
//         total: total || 0,
//         checkedIn: checked_in || 0,
//         notCheckedIn: (total || 0) - (checked_in || 0),
//         percentage: total > 0 ? Math.round((checked_in / total) * 100) : 0,
//     };
// };

// module.exports = { checkin, getCheckinStats };
