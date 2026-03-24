const Notification = require("../models/notificationModel");

exports.getMyNotifications = async (userId) => await Notification.getByUser(userId);
exports.getUnreadCount = async (userId) => await Notification.getUnreadCount(userId);
exports.markRead = async (id, userId) => await Notification.markRead(id, userId);
exports.markAllRead = async (userId) => await Notification.markAllRead(userId);
exports.delete = async (id) => await Notification.delete(id);

// Tạo thông báo cho nhiều user
exports.broadcast = async (userIds, data) => {
    for (const uid of userIds) {
        await Notification.create({ ...data, user_id: uid });
    }
};
