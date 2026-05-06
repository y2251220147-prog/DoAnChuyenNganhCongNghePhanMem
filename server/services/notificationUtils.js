const User = require("../models/userModel");
const Notification = require("../models/notificationModel");

/**
 * Gửi thông báo đến toàn bộ Admin trong hệ thống.
 */
exports.notifyAdmins = async (data) => {
    try {
        const users = await User.getAllUsers();
        const admins = users.filter(u => u.role === "admin");
        for (const admin of admins) {
            await Notification.create({ ...data, user_id: admin.id });
        }
    } catch (err) {
        console.error("Lỗi khi notifyAdmins:", err.message);
    }
};

/**
 * Gửi thông báo đến cấp quản lý (Admin và Organizer).
 */
exports.notifyManagers = async (data) => {
    try {
        const users = await User.getAllUsers();
        // Lọc ra danh sách Admin và Organizer
        const managers = users.filter(u => u.role === "admin" || u.role === "organizer");
        
        for (const manager of managers) {
            await Notification.create({
                ...data,
                user_id: manager.id
            });
        }
    } catch (err) {
        console.error("Lỗi khi notifyManagers:", err.message);
    }
};

