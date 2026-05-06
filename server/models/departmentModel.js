const db = require("../config/database");

const Department = {
    getAll: async () => {
        const [r] = await db.query(`
            SELECT d.*, u.name as manager_name,
                   (SELECT COUNT(*) FROM event_tasks WHERE assigned_department_id = d.id AND status != 'done') as active_tasks
            FROM departments d
            LEFT JOIN users u ON d.manager_id = u.id
            ORDER BY d.name ASC
        `);
        return r;
    },
    getById: async (id) => {
        const [r] = await db.query(`
            SELECT d.*, u.name as manager_name
            FROM departments d
            LEFT JOIN users u ON d.manager_id = u.id
            WHERE d.id = ?
        `, [id]);
        return r[0] || null;
    },
    create: async (data) => {
        const [r] = await db.query(
            "INSERT INTO departments (name, description, manager_id) VALUES (?, ?, ?)",
            [data.name, data.description || null, data.manager_id || null]
        );
        return r.insertId;
    },
    update: async (id, data) => {
        await db.query(
            "UPDATE departments SET name=?, description=?, manager_id=? WHERE id=?",
            [data.name, data.description || null, data.manager_id || null, id]
        );
    },
    delete: async (id) => {
        await db.query("DELETE FROM departments WHERE id=?", [id]);
    }
};

module.exports = Department;
