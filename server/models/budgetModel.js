const db = require("../config/database");

const Budget = {
    /**
     * Lấy tất cả khoản chi (kèm tên sự kiện) — dùng cho trang tổng quan
     */
    getAll: async () => {
        const [rows] = await db.query(`
            SELECT 
                CAST(eb.id AS CHAR) AS id,
                eb.event_id, eb.task_id, eb.item, eb.category, 
                CAST(eb.cost AS DOUBLE) AS cost, 
                eb.status, eb.note,
                eb.created_at, eb.updated_at,
                e.name AS event_name,
                CAST(COALESCE(t.estimated_budget, eb.cost) AS DOUBLE) AS estimated_cost
            FROM event_budget eb
            LEFT JOIN events e ON eb.event_id = e.id
            LEFT JOIN event_tasks t ON eb.task_id = t.id
            
            UNION ALL
            
            SELECT 
                CONCAT('task-', t.id) AS id,
                t.event_id, t.id AS task_id, t.title AS item, 'other' AS category, 
                CAST(t.estimated_budget AS DOUBLE) AS cost, 
                'pending' AS status, 'Dự trù từ nhiệm vụ' AS note,
                t.created_at, t.created_at AS updated_at,
                e.name AS event_name,
                CAST(t.estimated_budget AS DOUBLE) AS estimated_cost
            FROM event_tasks t
            LEFT JOIN events e ON t.event_id = e.id
            WHERE t.estimated_budget > 0
              AND NOT EXISTS (
                  SELECT 1 FROM event_budget eb WHERE eb.task_id = t.id
              )
            ORDER BY created_at DESC
        `);
        return rows;
    },

    /**
     * Lấy khoản chi theo sự kiện (kèm tiêu đề task nếu có liên kết)
     */
    getByEvent: async (eventId) => {
        const [rows] = await db.query(`
            SELECT 
                CAST(eb.id AS CHAR) AS id,
                eb.event_id, eb.task_id, eb.item, eb.category, 
                CAST(eb.cost AS DOUBLE) AS cost, 
                eb.status, eb.note,
                eb.created_at, eb.updated_at,
                e.name  AS event_name,
                t.title AS task_title,
                CAST(COALESCE(t.estimated_budget, eb.cost) AS DOUBLE) AS estimated_cost
            FROM event_budget eb
            LEFT JOIN events      e ON eb.event_id = e.id
            LEFT JOIN event_tasks t ON eb.task_id  = t.id
            WHERE eb.event_id = ?

            UNION ALL

            SELECT 
                CONCAT('task-', t.id) AS id,
                t.event_id, t.id AS task_id, t.title AS item, 'other' AS category, 
                CAST(t.estimated_budget AS DOUBLE) AS cost, 
                'pending' AS status, 'Dự trù từ nhiệm vụ' AS note,
                t.created_at, t.created_at AS updated_at,
                e.name AS event_name,
                t.title AS task_title,
                CAST(t.estimated_budget AS DOUBLE) AS estimated_cost
            FROM event_tasks t
            LEFT JOIN events e ON t.event_id = e.id
            WHERE t.event_id = ?
              AND t.estimated_budget > 0
              AND NOT EXISTS (
                  SELECT 1 FROM event_budget eb WHERE eb.task_id = t.id
              )
            ORDER BY status DESC, created_at DESC
        `, [eventId, eventId]);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query(`
            SELECT eb.*, e.name AS event_name
            FROM event_budget eb
            LEFT JOIN events e ON eb.event_id = e.id
            WHERE eb.id = ?
        `, [id]);
        return rows[0] || null;
    },

    findByTaskId: async (taskId) => {
        const [rows] = await db.query(`
            SELECT * FROM event_budget WHERE task_id = ? LIMIT 1
        `, [taskId]);
        return rows[0] || null;
    },

    create: async ({ event_id, item, cost, note, status, category, task_id }) => {
        const [r] = await db.query(
            `INSERT INTO event_budget (event_id, task_id, item, category, cost, status, note)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                event_id,
                task_id || null,
                item,
                category || 'other',
                Number(cost),
                status || 'pending',
                note || null
            ]
        );
        return r.insertId;
    },

    update: async (id, { item, cost, note, status, category, task_id }) => {
        await db.query(
            `UPDATE event_budget
             SET item=?, category=?, cost=?, status=?, note=?, task_id=?
             WHERE id=?`,
            [item, category || 'other', Number(cost), status || 'pending', note || null, task_id || null, id]
        );
    },

    delete: async (id) => {
        await db.query("DELETE FROM event_budget WHERE id = ?", [id]);
    },

    /**
     * Tổng hợp ngân sách cho 1 sự kiện:
     *  - total_estimated: tổng dự kiến (tất cả khoản)
     *  - total_paid: đã thực chi (status='paid')
     *  - total_pending: chưa chi (status='pending')
     */
    getSummaryByEvent: async (eventId) => {
        const [rows] = await db.query(`
            SELECT
                (SELECT COUNT(*) FROM event_budget WHERE event_id = ?) + 
                (SELECT COUNT(*) FROM event_tasks t WHERE t.event_id = ? AND t.estimated_budget > 0 AND NOT EXISTS (SELECT 1 FROM event_budget eb WHERE eb.task_id = t.id)) AS item_count,

                (SELECT COALESCE(SUM(cost), 0) FROM event_budget WHERE event_id = ?) +
                (SELECT COALESCE(SUM(estimated_budget), 0) FROM event_tasks t WHERE t.event_id = ? AND t.estimated_budget > 0 AND NOT EXISTS (SELECT 1 FROM event_budget eb WHERE eb.task_id = t.id)) AS total_estimated,

                (SELECT COALESCE(SUM(cost), 0) FROM event_budget WHERE event_id = ? AND status='paid') AS total_paid,

                (SELECT COALESCE(SUM(cost), 0) FROM event_budget WHERE event_id = ? AND status='pending') +
                (SELECT COALESCE(SUM(estimated_budget), 0) FROM event_tasks t WHERE t.event_id = ? AND t.estimated_budget > 0 AND NOT EXISTS (SELECT 1 FROM event_budget eb WHERE eb.task_id = t.id)) AS total_pending
        `, [eventId, eventId, eventId, eventId, eventId, eventId, eventId]);
        return rows[0];
    }
};

module.exports = Budget;
