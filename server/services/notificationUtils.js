const User = require("../models/userModel");
const Notification = require("../models/notificationModel");

/**
 * Gửi thông báo đến toàn bộ Admin trong hệ thống.
 * @param {Object} data - Dữ liệu thông báo (type, title, message, link)
 */
exports.notifyAdmins = async (data) => {
    try {
        const users = await User.getAllUsers();
        // Lọc ra danh sách Admin
        const admins = users.filter(u => u.role === "admin");
        
        for (const admin of admins) {
            await Notification.create({
                ...data,
                user_id: admin.id
            });
        }
    } catch (err) {
        console.error("Lỗi khi notifyAdmins:", err.message);
    }
};
