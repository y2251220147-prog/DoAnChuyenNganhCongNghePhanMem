const db = require("../config/database");

const Department = {
    async getAll() {
        const [rows] = await db.query(`
            SELECT d.*, u.name as manager_name,
                   (SELECT COUNT(*) FROM users WHERE department_id = d.id) AS member_count
            FROM departments d 
            LEFT JOIN users u ON d.manager_id = u.id 
            ORDER BY d.name ASC
        `);
        return rows;
    },
    async getById(id) {
        const [rows] = await db.query("SELECT * FROM departments WHERE id = ?", [id]);
        return rows[0] || null;
    },
    async create(data) {
        const [result] = await db.query(
            "INSERT INTO departments (name, code, manager_id, description) VALUES (?, ?, ?, ?)",
            [data.name, data.code, data.manager_id || null, data.description || ""]
        );
        return result.insertId;
    },
    async update(id, data) {
        await db.query(
            "UPDATE departments SET name = ?, code = ?, manager_id = ?, description = ? WHERE id = ?",
            [data.name, data.code, data.manager_id || null, data.description || "", id]
        );
    },
    async delete(id) {
        await db.query("DELETE FROM departments WHERE id = ?", [id]);
    }
};

module.exports = Department;
