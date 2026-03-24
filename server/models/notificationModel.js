const db = require("../config/database");
const Notification = {
    getByUser: async (userId, limit = 30) => {
        const [r] = await db.query(
            "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT ?",
            [userId, limit]
        );
        return r;
    },
    getUnreadCount: async (userId) => {
        const [r] = await db.query(
            "SELECT COUNT(*) AS cnt FROM notifications WHERE user_id=? AND read_at IS NULL",
            [userId]
        );
        return r[0].cnt;
    },
    create: async (d) => {
        const [r] = await db.query(
            "INSERT INTO notifications (user_id,type,title,message,link) VALUES (?,?,?,?,?)",
            [d.user_id, d.type, d.title, d.message || null, d.link || null]
        );
        return r.insertId;
    },
    markRead: async (id, userId) => {
        await db.query(
            "UPDATE notifications SET read_at=NOW() WHERE id=? AND user_id=?",
            [id, userId]
        );
    },
    markAllRead: async (userId) => {
        await db.query(
            "UPDATE notifications SET read_at=NOW() WHERE user_id=? AND read_at IS NULL",
            [userId]
        );
    },
    delete: async (id) => { await db.query("DELETE FROM notifications WHERE id=?", [id]); }
};
module.exports = Notification;
