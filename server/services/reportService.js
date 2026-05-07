const db = require("../config/database");

/**
 * Dashboard tổng quan.
 * Số liệu người tham dự được gộp từ cả bảng attendees (nội bộ) và guests (khách ngoài).
 */
exports.getOverview = async () => {
    const [[ev]] = await db.query("SELECT COUNT(*) AS total FROM events");
    const [[run]] = await db.query("SELECT COUNT(*) AS total FROM events WHERE status='running'");
    const [[usr]] = await db.query("SELECT COUNT(*) AS total FROM users");

    // Chỉ dùng bảng attendees (đã hợp nhất)
    const [[att]] = await db.query(`
        SELECT
            COUNT(*) AS total,
            COALESCE(SUM(checked_in),0) AS checked_in
        FROM attendees
    `);

    const [[directBud]] = await db.query("SELECT COALESCE(SUM(cost),0) AS total FROM event_budget WHERE status='paid'");
    const [[plan]]     = await db.query("SELECT COALESCE(SUM(total_budget),0) AS total FROM events");

    // Đếm số sự kiện vượt ngân sách
    const [[over]] = await db.query(`
        SELECT COUNT(*) AS count FROM (
            SELECT e.id, e.total_budget, COALESCE(SUM(eb.cost),0) AS actual
            FROM events e
            LEFT JOIN event_budget eb ON e.id = eb.event_id AND eb.status = 'paid'
            GROUP BY e.id
            HAVING actual > e.total_budget AND e.total_budget > 0
        ) t
    `);

    return {
        events: { total: ev.total, running: run.total },
        users: usr.total,
        attendees: { total: Number(att.total) || 0, checkedIn: Number(att.checked_in) || 0 },
        budget: { planned: Number(plan.total), actual: Number(directBud.total) || 0, overBudgetCount: over.count }
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
               COALESCE(a.cnt, 0) AS registered,
               COALESCE(a.ci,  0) AS checked_in
        FROM events e
        LEFT JOIN (
            SELECT event_id, COUNT(*) AS cnt, COALESCE(SUM(checked_in),0) AS ci
            FROM attendees GROUP BY event_id
        ) a ON a.event_id = e.id
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
               COALESCE(b.direct_actual, 0) AS actual
        FROM events e 
        LEFT JOIN (
            SELECT event_id, SUM(cost) AS direct_actual 
            FROM event_budget WHERE status='paid' GROUP BY event_id
        ) b ON e.id = b.event_id
        WHERE e.total_budget > 0
        ORDER BY actual DESC
    `);
    return rows;
};

/**
 * Thống kê ngân sách CHI TIẾT theo từng công việc/hạng mục (Giống danh sách trong Quản lý ngân sách)
 */
exports.getBudgetDetail = async () => {
    const [rows] = await db.query(`
        -- 1. Lấy tất cả các khoản chi đã có trong bảng event_budget (Phiếu chi)
        SELECT 
            e.name AS event_name,
            eb.item AS item_name,
            CAST(COALESCE(t.estimated_budget, eb.cost) AS DOUBLE) AS planned,
            CAST(CASE WHEN eb.status = 'paid' THEN eb.cost ELSE 0 END AS DOUBLE) AS actual,
            eb.status
        FROM event_budget eb
        JOIN events e ON eb.event_id = e.id
        LEFT JOIN event_tasks t ON eb.task_id = t.id

        UNION ALL

        -- 2. Lấy các nhiệm vụ có ngân sách dự kiến nhưng CHƯA tạo phiếu chi
        SELECT 
            e.name AS event_name,
            t.title AS item_name,
            CAST(t.estimated_budget AS DOUBLE) AS planned,
            0 AS actual,
            'pending' AS status
        FROM event_tasks t
        JOIN events e ON t.event_id = e.id
        WHERE t.estimated_budget > 0
          AND NOT EXISTS (
              SELECT 1 FROM event_budget eb WHERE eb.task_id = t.id
          )

        ORDER BY event_name, status DESC, item_name
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
 * Danh sách chi tiết tiến độ công việc (Cho báo cáo)
 */
exports.getTaskDetail = async () => {
    const [rows] = await db.query(`
        SELECT 
            t.id,
            e.name AS event_name,
            t.title AS task_name,
            COALESCE(u.name, d.name) AS assignee,
            t.status
        FROM event_tasks t
        JOIN events e ON t.event_id = e.id
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN departments d ON t.assigned_department_id = d.id
        ORDER BY e.name, t.status, t.title
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
 * Danh sách chi tiết khách mời & check-in (Cho báo cáo)
 */
exports.getAttendeeDetail = async () => {
    const [rows] = await db.query(`
        SELECT 
            e.name AS event_name,
            a.name AS attendee_name,
            a.attendee_type,
            a.checked_in
        FROM attendees a
        JOIN events e ON a.event_id = e.id
        ORDER BY e.name, a.attendee_type, a.name
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
        JOIN feedback f ON e.id = f.event_id
        GROUP BY e.id
        ORDER BY avg_rating DESC
    `);
    return rows;
};

/**
 * Danh sách chi tiết phản hồi (Cho báo cáo)
 */
exports.getFeedbackDetail = async () => {
    const [rows] = await db.query(`
        SELECT 
            e.name AS event_name,
            f.name AS reviewer_name,
            f.rating,
            f.message AS content,
            f.created_at
        FROM feedback f
        JOIN events e ON f.event_id = e.id
        ORDER BY e.name, f.created_at DESC
    `);
    return rows;
};
