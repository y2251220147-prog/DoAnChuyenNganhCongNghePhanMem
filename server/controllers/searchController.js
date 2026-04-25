const db = require("../config/database");

exports.globalSearch = async (req, res) => {
    try {
        const { q, page = 1, limit = 5 } = req.query;
        if (!q) {
            return res.json({ events: [], venues: [], users: [], hasMore: false });
        }

        const keyword = `%${q}%`;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        // 1. Search Events
        const [events] = await db.query(`
            SELECT id, name, description, start_date, location, status, 'event' as type
            FROM events
            WHERE name LIKE ? OR description LIKE ? OR location LIKE ?
            LIMIT ? OFFSET ?
        `, [keyword, keyword, keyword, limitNum, offset]);

        // 2. Search Venues
        const [venues] = await db.query(`
            SELECT id, name, type, location, capacity, 'venue' as type
            FROM venues
            WHERE name LIKE ? OR description LIKE ? OR location LIKE ?
            LIMIT ? OFFSET ?
        `, [keyword, keyword, keyword, limitNum, offset]);

        // 3. Search Users
        const [users] = await db.query(`
            SELECT id, name, email, role, avatar, 'user' as type
            FROM users
            WHERE name LIKE ? OR email LIKE ?
            LIMIT ? OFFSET ?
        `, [keyword, keyword, limitNum, offset]);

        // Check if there might be more
        const hasMore = events.length === limitNum || venues.length === limitNum || users.length === limitNum;

        res.json({
            events,
            venues,
            users,
            hasMore
        });
    } catch (err) {
        console.error("Global Search Error:", err);
        res.status(500).json({ message: "Lỗi tìm kiếm" });
    }
};
