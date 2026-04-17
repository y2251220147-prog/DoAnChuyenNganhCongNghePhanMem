const db = require("../config/database");

/**
 * Dashboard tổng quan.
 * Số liệu người tham dự được gộp từ cả bảng attendees (nội bộ) và guests (khách ngoài).
 */
exports.getOverview = async () => {
    const [[ev]] = await db.query("SELECT COUNT(*) AS total FROM events");
    const [[run]] = await db.query("SELECT COUNT(*) AS total FROM events WHERE status='running'");
    const [[usr]] = await db.query("SELECT COUNT(*) AS total FROM users");

    // Gộp attendees + guests
    const [[att]] = await db.query(`
        SELECT
            (SELECT COUNT(*) FROM attendees) + (SELECT COUNT(*) FROM guests) AS total,
            (SELECT COALESCE(SUM(checked_in),0) FROM attendees) +
            (SELECT COALESCE(SUM(checked_in),0) FROM guests) AS checked_in
    `);

    const [[bud]]  = await db.query("SELECT COALESCE(SUM(cost),0) AS total FROM event_budget");
    const [[plan]] = await db.query("SELECT COALESCE(SUM(total_budget),0) AS total FROM events");

    return {
        events: { total: ev.total, running: run.total },
        users: usr.total,
        attendees: { total: Number(att.total) || 0, checkedIn: Number(att.checked_in) || 0 },
        budget: { planned: Number(plan.total), actual: Number(bud.total) }
    };
};

/**
 * Thống kê sự kiện theo tháng.
 */
exports.getEventsByMonth = async (year) => {
    const y = year || new Date().getFullYear();
    const [rows] = await db.query(`
        SELECT MONTH(created_at) AS month, COUNT(*) AS count
        FROM events WHERE YEAR(created_at)=?
        GROUP BY MONTH(created_at) ORDER BY month
    `, [y]);
    return rows;
};

/**
 * Thống kê đăng ký & check-in theo event.
 * Gộp cả attendees (nội bộ) và guests (khách ngoài).
 */
exports.getAttendeesByEvent = async () => {
    const [rows] = await db.query(`
        SELECT e.id, e.name, e.status, e.capacity,
               COALESCE(a.cnt, 0) + COALESCE(g.cnt, 0)        AS registered,
               COALESCE(a.ci,  0) + COALESCE(g.ci,  0)        AS checked_in
        FROM events e
        LEFT JOIN (
            SELECT event_id, COUNT(*) AS cnt, COALESCE(SUM(checked_in),0) AS ci
            FROM attendees GROUP BY event_id
        ) a ON a.event_id = e.id
        LEFT JOIN (
            SELECT event_id, COUNT(*) AS cnt, COALESCE(SUM(checked_in),0) AS ci
            FROM guests GROUP BY event_id
        ) g ON g.event_id = e.id
        ORDER BY registered DESC
    `);
    return rows;
};

/**
 * Thống kê ngân sách theo sự kiện.
 */
exports.getBudgetByEvent = async () => {
    const [rows] = await db.query(`
        SELECT e.id, e.name, e.total_budget AS planned,
               COALESCE(SUM(b.cost),0) AS actual
        FROM events e LEFT JOIN event_budget b ON e.id = b.event_id
        GROUP BY e.id HAVING planned > 0 ORDER BY actual DESC
    `);
    return rows;
};

/**
 * Thống kê tasks theo trạng thái.
 */
exports.getTaskStats = async () => {
    const [rows] = await db.query(`
        SELECT status, COUNT(*) AS count FROM event_tasks GROUP BY status
    `);
    return rows;
};

/**
 * Thống kê sự kiện theo loại.
 */
exports.getEventsByType = async () => {
    const [rows] = await db.query(`
        SELECT COALESCE(event_type,'Khác') AS type, COUNT(*) AS count
        FROM events GROUP BY event_type ORDER BY count DESC
    `);
    return rows;
};

/**
 * Thống kê phản hồi theo sự kiện.
 */
exports.getFeedbackStats = async () => {
    const [rows] = await db.query(`
        SELECT e.name, 
               COUNT(f.id) AS total_feedback,
               AVG(f.rating) AS avg_rating
        FROM events e 
        JOIN feedbacks f ON e.id = f.event_id
        GROUP BY e.id
        ORDER BY avg_rating DESC
    `);
    return rows;
};
