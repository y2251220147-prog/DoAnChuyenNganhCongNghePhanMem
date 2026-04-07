const db = require("../config/database");

const Event = {

    async getAll() {
        const [rows] = await db.query(`
            SELECT e.*, u.name AS owner_name, a.name AS approver_name,
                   (SELECT COUNT(*) FROM attendees att WHERE att.event_id = e.id) AS registered_count
            FROM events e
            LEFT JOIN users u ON e.owner_id = u.id
            LEFT JOIN users a ON e.approved_by = a.id
            ORDER BY e.created_at DESC
        `);
        return rows;
    },

    async getById(id) {
        const [rows] = await db.query(`
            SELECT e.*, u.name AS owner_name, a.name AS approver_name,
                   (SELECT COUNT(*) FROM attendees att WHERE att.event_id = e.id) AS registered_count
            FROM events e
            LEFT JOIN users u ON e.owner_id = u.id
            LEFT JOIN users a ON e.approved_by = a.id
            WHERE e.id = ?
        `, [id]);
        return rows[0] || null;
    },

    async create(data) {
        const {
            name, description, event_type, owner_id,
            start_date, end_date,
            venue_type, location, capacity,
            total_budget, status
        } = data;
        const [result] = await db.query(`
            INSERT INTO events
                (name, description, event_type, owner_id, start_date, end_date,
                 venue_type, location, capacity, total_budget, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, description || null, event_type || null, owner_id || null,
            start_date, end_date,
            venue_type || "offline", location || null, capacity || null,
            total_budget || 0, status || "draft"
        ]);
        return result.insertId;
    },

    async update(id, data) {
        const {
            name, description, event_type, owner_id,
            start_date, end_date,
            venue_type, location, capacity,
            total_budget, status
        } = data;
        await db.query(`
            UPDATE events
            SET name=?, description=?, event_type=?, owner_id=?,
                start_date=?, end_date=?,
                venue_type=?, location=?, capacity=?,
                total_budget=?, status=?
            WHERE id=?
        `, [
            name, description, event_type, owner_id,
            start_date, end_date,
            venue_type, location, capacity,
            total_budget, status, id
        ]);
    },

    async approve(id, approverId) {
        await db.query(
            "UPDATE events SET status='approved', approved_by=?, approved_at=NOW() WHERE id=?",
            [approverId, id]
        );
    },

    async changeStatus(id, status) {
        await db.query("UPDATE events SET status=? WHERE id=?", [status, id]);
    },

    async delete(id) {
        await db.query("DELETE FROM events WHERE id = ?", [id]);
    },

    // ── Server-side Search với LIKE + Pagination ───────────────
    async search({ keyword = "", status = "", event_type = "", date_from = "", date_to = "", page = 1, limit = 10 }) {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const params = [];
        const conditions = [];

        // Tìm kiếm theo từ khóa (LIKE)
        if (keyword) {
            conditions.push("(e.name LIKE ? OR e.description LIKE ? OR e.location LIKE ?)");
            const kw = `%${keyword}%`;
            params.push(kw, kw, kw);
        }

        // Lọc theo trạng thái
        if (status) {
            conditions.push("e.status = ?");
            params.push(status);
        }

        // Lọc theo loại sự kiện
        if (event_type) {
            conditions.push("e.event_type = ?");
            params.push(event_type);
        }

        // Lọc theo ngày bắt đầu
        if (date_from) {
            conditions.push("e.start_date >= ?");
            params.push(date_from);
        }

        // Lọc theo ngày kết thúc
        if (date_to) {
            conditions.push("e.end_date <= ?");
            params.push(date_to + " 23:59:59");
        }

        const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

        // Đếm tổng kết quả
        const [countRows] = await db.query(`
            SELECT COUNT(*) AS total
            FROM events e
            LEFT JOIN users u ON e.owner_id = u.id
            ${where}
        `, params);
        const total = countRows[0].total;

        // Lấy dữ liệu với phân trang
        const [rows] = await db.query(`
            SELECT e.*, u.name AS owner_name, a.name AS approver_name,
                   (SELECT COUNT(*) FROM attendees att WHERE att.event_id = e.id) AS registered_count
            FROM events e
            LEFT JOIN users u ON e.owner_id = u.id
            LEFT JOIN users a ON e.approved_by = a.id
            ${where}
            ORDER BY e.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);

        return {
            data: rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        };
    }
};

module.exports = Event;
