const db = require("../config/database");

const User = {
    async findByEmail(email) {
        const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        return rows[0] || null;
    },
    async createUser(user) {
        const { name, email, password, role } = user;
        const [result] = await db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, password, role || "user"]
        );
        return result.insertId;
    },
    async getAllUsers() {
        const [rows] = await db.query("SELECT id, name, email, role, created_at FROM users ORDER BY id DESC");
        return rows;
    },
    async findById(id) {
        const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
        return rows[0] || null;
    },
    async updateRole(id, role) {
        await db.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    },
    async updatePassword(id, password) {
        await db.query("UPDATE users SET password = ? WHERE id = ?", [password, id]);
    },
    async deleteUser(id) {
        await db.query("DELETE FROM users WHERE id = ?", [id]);
    },
    async updateProfile(id, profileData) {
        const { name, phone, department, position, avatar } = profileData;
        await db.query(
            "UPDATE users SET name = ?, phone = ?, department = ?, position = ?, avatar = ? WHERE id = ?",
            [name, phone || null, department || null, position || null, avatar || null, id]
        );
    }
};

module.exports = User;
