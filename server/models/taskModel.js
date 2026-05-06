const db = require("../config/database");

const Task = {

    // ── Phases ────────────────────────────────────────────────
    getPhases: async (eventId) => {
        const [r] = await db.query(
            "SELECT * FROM task_phases WHERE event_id=? ORDER BY position,id",
            [eventId]
        );
        return r;
    },
    createPhase: async (d) => {
        const [r] = await db.query(
            "INSERT INTO task_phases (event_id,name,color,position) VALUES (?,?,?,?)",
            [d.event_id, d.name, d.color || '#6366f1', d.position || 0]
        );
        return r.insertId;
    },
    updatePhase: async (id, d) => {
        await db.query("UPDATE task_phases SET name=?,color=?,position=? WHERE id=?",
            [d.name, d.color || '#6366f1', d.position || 0, id]);
    },
    deletePhase: async (id) => {
        await db.query("DELETE FROM task_phases WHERE id=?", [id]);
    },

    // ── Tasks ─────────────────────────────────────────────────
    getByEvent: async (eventId) => {
        const [r] = await db.query(`
            SELECT t.*,
                   u.name  AS assigned_name,
                   u.email AS assigned_email,
                   d.name  AS assigned_department_name,
                   c.name  AS creator_name,
                   p.name  AS phase_name,
                   p.color AS phase_color,
                   (SELECT COUNT(*) FROM event_tasks sub WHERE sub.parent_id = t.id) AS subtask_count,
                   (SELECT COUNT(*) FROM event_tasks sub WHERE sub.parent_id = t.id AND sub.status='done') AS subtask_done,
                   (SELECT COUNT(*) FROM task_comments tc WHERE tc.task_id = t.id) AS comment_count
            FROM event_tasks t
            LEFT JOIN users      u ON t.assigned_to = u.id
            LEFT JOIN departments d ON t.assigned_department_id = d.id
            LEFT JOIN users      c ON t.created_by  = c.id
            LEFT JOIN task_phases p ON t.phase_id   = p.id
            WHERE t.event_id = ?
            ORDER BY COALESCE(t.phase_id,999), t.parent_id IS NOT NULL, t.position, t.priority DESC
        `, [eventId]);
        return r;
    },

    getById: async (id) => {
        const [r] = await db.query(`
            SELECT t.*, u.name AS assigned_name, d.name AS assigned_department_name, c.name AS creator_name, p.name AS phase_name
            FROM event_tasks t
            LEFT JOIN users       u ON t.assigned_to = u.id
            LEFT JOIN departments d ON t.assigned_department_id = d.id
            LEFT JOIN users       c ON t.created_by  = c.id
            LEFT JOIN task_phases p ON t.phase_id    = p.id
            WHERE t.id=?
        `, [id]);
        return r[0] || null;
    },

    create: async (d) => {
        const [r] = await db.query(`
            INSERT INTO event_tasks
              (event_id,phase_id,parent_id,title,description,assigned_to,assigned_department_id,supporters,
               status,priority,due_date,start_date,is_milestone,position,progress,
               estimated_h,estimated_budget,created_by)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `, [
            d.event_id, d.phase_id || null, d.parent_id || null,
            d.title, d.description || null,
            d.assigned_to || null, d.assigned_department_id || null,
            d.supporters ? JSON.stringify(d.supporters) : null,
            d.status || 'todo', d.priority || 'medium',
            d.due_date || null, d.start_date || null,
            d.is_milestone ? 1 : 0, d.position || 0, d.progress || 0,
            d.estimated_h || null, d.estimated_budget || 0, d.created_by || null
        ]);
        return r.insertId;
    },

    update: async (id, d) => {
        await db.query(`
            UPDATE event_tasks SET
              phase_id=?,parent_id=?,title=?,description=?,assigned_to=?,assigned_department_id=?,supporters=?,
              status=?,priority=?,due_date=?,start_date=?,is_milestone=?,position=?,
              progress=?,estimated_h=?,actual_h=?,estimated_budget=?,feedback_status=?,feedback_note=?
            WHERE id=?
        `, [
            d.phase_id || null, d.parent_id || null,
            d.title, d.description || null,
            d.assigned_to || null, d.assigned_department_id || null,
            d.supporters ? JSON.stringify(d.supporters) : null,
            d.status, d.priority,
            d.due_date || null, d.start_date || null,
            d.is_milestone ? 1 : 0, d.position || 0,
            d.progress || 0, d.estimated_h || null, d.actual_h || null,
            d.estimated_budget || 0, d.feedback_status || 'none', d.feedback_note || null,
            id
        ]);
    },

    updateStatus: async (id, status) => {
        await db.query("UPDATE event_tasks SET status=?, progress=? WHERE id=?", [status, status === 'done' ? 100 : 0, id]);
    },

    updateProgress: async (id, progress) => {
        await db.query("UPDATE event_tasks SET progress=? WHERE id=?",
            [Math.min(100, Math.max(0, progress)), id]);
    },

    updateFeedback: async (id, data) => {
        await db.query(
            "UPDATE event_tasks SET feedback_status=?, feedback_note=? WHERE id=?",
            [data.feedback_status || 'none', data.feedback_note || null, id]
        );
    },

    delete: async (id) => {
        await db.query("DELETE FROM event_tasks WHERE id=?", [id]);
    },

    // ── Comments ──────────────────────────────────────────────
    getComments: async (taskId) => {
        const [r] = await db.query(`
            SELECT tc.*, u.name AS user_name
            FROM task_comments tc
            JOIN users u ON tc.user_id = u.id
            WHERE tc.task_id=?
            ORDER BY tc.created_at ASC
        `, [taskId]);
        return r;
    },

    addComment: async (d) => {
        const [r] = await db.query(
            "INSERT INTO task_comments (task_id,user_id,content,type) VALUES (?,?,?,?)",
            [d.task_id, d.user_id, d.content, d.type || 'comment']
        );
        return r.insertId;
    },

    deleteComment: async (id) => {
        await db.query("DELETE FROM task_comments WHERE id=?", [id]);
    },

    // ── History ───────────────────────────────────────────────
    getHistory: async (taskId) => {
        const [r] = await db.query(`
            SELECT th.*, u.name AS user_name
            FROM task_history th
            JOIN users u ON th.user_id = u.id
            WHERE th.task_id=?
            ORDER BY th.created_at DESC
        `, [taskId]);
        return r;
    },

    addHistory: async (d) => {
        await db.query(
            "INSERT INTO task_history (task_id,user_id,action,old_value,new_value) VALUES (?,?,?,?,?)",
            [d.task_id, d.user_id, d.action, d.old_value || null, d.new_value || null]
        );
    },

    // ── Stats ─────────────────────────────────────────────────
    getEventStats: async (eventId) => {
        const [rows] = await db.query(`
            SELECT
                COUNT(*) AS total,
                SUM(status='todo')        AS todo,
                SUM(status='in_progress') AS in_progress,
                SUM(status='done')        AS done,
                SUM(status NOT IN ('done') AND due_date < NOW()) AS overdue,
                ROUND(AVG(IF(status='done', 100, 0)), 0)   AS avg_progress
            FROM event_tasks
            WHERE event_id=? AND parent_id IS NULL
        `, [eventId]);
        return rows[0];
    },

    // Tasks sắp đến hạn (cho reminder)
    getUpcomingDeadlines: async (hoursAhead = 24) => {
        const [r] = await db.query(`
            SELECT t.*, u.id AS assignee_id, e.name AS event_name
            FROM event_tasks t
            JOIN users u ON t.assigned_to = u.id
            JOIN events e ON t.event_id = e.id
            WHERE t.status NOT IN ('done','cancelled')
              AND t.due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? HOUR)
              AND NOT EXISTS (
                SELECT 1 FROM task_reminders tr
                WHERE tr.task_id = t.id AND tr.sent = 0
                  AND tr.remind_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
              )
        `, [hoursAhead]);
        return r;
    }
};

module.exports = Task;
