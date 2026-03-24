const db = require("../config/database");

// Dashboard tổng quan
exports.getOverview = async () => {
    const [[ev]] = await db.query("SELECT COUNT(*) AS total FROM events");
    const [[run]] = await db.query("SELECT COUNT(*) AS total FROM events WHERE status='running'");
    const [[usr]] = await db.query("SELECT COUNT(*) AS total FROM users");
    const [[att]] = await db.query("SELECT COUNT(*) AS total FROM attendees");
    const [[ci]] = await db.query("SELECT COUNT(*) AS total FROM attendees WHERE checked_in=1");
    const [[bud]] = await db.query("SELECT COALESCE(SUM(cost),0) AS total FROM event_budget");
    const [[plan]] = await db.query("SELECT COALESCE(SUM(total_budget),0) AS total FROM events");
    return {
        events: { total: ev.total, running: run.total },
        users: usr.total,
        attendees: { total: att.total, checkedIn: ci.total },
        budget: { planned: Number(plan.total), actual: Number(bud.total) }
    };
};

// Thống kê sự kiện theo tháng
exports.getEventsByMonth = async (year) => {
    const y = year || new Date().getFullYear();
    const [rows] = await db.query(`
        SELECT MONTH(created_at) AS month, COUNT(*) AS count
        FROM events WHERE YEAR(created_at)=?
        GROUP BY MONTH(created_at) ORDER BY month
    `, [y]);
    return rows;
};

// Thống kê đăng ký theo event
exports.getAttendeesByEvent = async (limit = 10) => {
    const [rows] = await db.query(`
        SELECT e.id, e.name, e.status, e.capacity,
               COUNT(a.id) AS registered,
               SUM(a.checked_in) AS checked_in
        FROM events e LEFT JOIN attendees a ON e.id = a.event_id
        GROUP BY e.id ORDER BY registered DESC LIMIT ?
    `, [limit]);
    return rows;
};

// Thống kê ngân sách theo sự kiện
exports.getBudgetByEvent = async (limit = 10) => {
    const [rows] = await db.query(`
        SELECT e.id, e.name, e.total_budget AS planned,
               COALESCE(SUM(b.cost),0) AS actual
        FROM events e LEFT JOIN event_budget b ON e.id = b.event_id
        GROUP BY e.id HAVING planned > 0 ORDER BY actual DESC LIMIT ?
    `, [limit]);
    return rows;
};

// Thống kê tasks
exports.getTaskStats = async () => {
    const [rows] = await db.query(`
        SELECT status, COUNT(*) AS count FROM event_tasks GROUP BY status
    `);
    return rows;
};

// Thống kê theo loại sự kiện
exports.getEventsByType = async () => {
    const [rows] = await db.query(`
        SELECT COALESCE(event_type,'Khác') AS type, COUNT(*) AS count
        FROM events GROUP BY event_type ORDER BY count DESC
    `);
    return rows;
};
