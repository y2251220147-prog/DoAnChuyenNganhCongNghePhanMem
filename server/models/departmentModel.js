const db = require("../config/database");

const Department = {
    async getAll() {
        const [rows] = await db.query("SELECT * FROM departments ORDER BY id DESC");
        return rows;
    },
    async getById(id) {
        const [rows] = await db.query("SELECT * FROM departments WHERE id = ?", [id]);
        return rows[0] || null;
    },
    async create(name, description) {
        const [result] = await db.query("INSERT INTO departments (name, description) VALUES (?, ?)", [name, description]);
        return result.insertId;
    },
    async update(id, name, description) {
        await db.query("UPDATE departments SET name = ?, description = ? WHERE id = ?", [name, description, id]);
    },
    async delete(id) {
        await db.query("DELETE FROM departments WHERE id = ?", [id]);
    },
    async getUsersByDepartment(id) {
        const [rows] = await db.query("SELECT id, name, email, role, avatar FROM users WHERE department_id = ?", [id]);
        return rows;
    },
    async setUsersDepartment(departmentId, userIds) {
        await db.query("UPDATE users SET department_id = NULL WHERE department_id = ?", [departmentId]);
        if (userIds && userIds.length > 0) {
            await db.query(`UPDATE users SET department_id = ? WHERE id IN (?)`, [departmentId, userIds]);
        }
    }
};

module.exports = Department;
