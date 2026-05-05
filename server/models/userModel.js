const db = require("../config/database");

const User = {
    async findByEmail(email) {
        const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        return rows[0] || null;
    },
    async createUser(user) {
        const { name, email, password, role, department_id } = user;
        const [result] = await db.query(
            "INSERT INTO users (name, email, password, role, department_id) VALUES (?, ?, ?, ?, ?)",
            [name, email, password, role || "user", department_id || null]
        );
        return result.insertId;
    },
    async getAllUsers() {
        const [rows] = await db.query(`
            SELECT u.id, u.name, u.email, u.role, u.avatar, u.phone, u.gender, u.address, u.created_at, 
                   u.department_id, d.name as department_name 
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            ORDER BY u.id DESC
        `);
        return rows;
    },
    async findById(id) {
        const [rows] = await db.query(`
            SELECT u.*, d.name as department_name 
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.id = ?
        `, [id]);
        return rows[0] || null;
    },
    async updateRole(id, role) {
        await db.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    },
    async updateDepartment(id, department_id, position) {
        await db.query(
            "UPDATE users SET department_id = ?, position = ? WHERE id = ?",
            [department_id || null, position || null, id]
        );
    },
    async updatePassword(id, password) {
        await db.query("UPDATE users SET password = ? WHERE id = ?", [password, id]);
    },
    async deleteUser(id) {
        await db.query("DELETE FROM users WHERE id = ?", [id]);
    },
    async updateAvatar(id, avatarUrl) {
        await db.query("UPDATE users SET avatar = ? WHERE id = ?", [avatarUrl, id]);
    },
    async updateProfile(id, data) {
        const { name, phone, gender, address, department_id } = data;
        await db.query(
            "UPDATE users SET name = ?, phone = ?, gender = ?, address = ?, department_id = ? WHERE id = ?",
            [name, phone, gender, address, department_id || null, id]
        );
    }
};

module.exports = User;
