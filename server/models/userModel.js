const db = require("../config/database");

const User = {

    async findByEmail(email) {

        const [rows] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        return rows[0];
    },

    async createUser(user) {
        const { name, email, password, role, phone, address, gender, verification_token, is_verified } = user;
        const [result] = await db.query(
            "INSERT INTO users (name, email, password, role, phone, address, gender, verification_token, is_verified) VALUES (?,?,?,?,?,?,?,?,?)",
            [name, email, password, role || "user", phone || null, address || null, gender || null, verification_token || null, is_verified || 0]
        );
        return result.insertId;
    },

    async getAllUsers() {

        const [rows] = await db.query(
            "SELECT id,name,email,role FROM users"
        );

        return rows;
    },

    async updateRole(id, role) {

        await db.query(
            "UPDATE users SET role = ? WHERE id = ?",
            [role, id]
        );

    },

    async findById(id) {

        const [rows] = await db.query(
            "SELECT * FROM users WHERE id = ?",
            [id]
        );

        return rows[0];
    },

    async updatePassword(id, password) {

        await db.query(
            "UPDATE users SET password = ? WHERE id = ?",
            [password, id]
        );

    },

    async updateUser(id, data) {
        const { name, email, phone, address, gender } = data;
        const [result] = await db.query(
            "UPDATE `users` SET `name` = ?, `email` = ?, `phone` = ?, `address` = ?, `gender` = ? WHERE `id` = ?",
            [name, email, phone, address, gender, id]
        );
        return result;
    },

    async verifyUser(token) {
        const [result] = await db.query(
            "UPDATE users SET is_verified = 1, verification_token = NULL WHERE verification_token = ?",
            [token]
        );
        return result.affectedRows > 0;
    },

    async deleteUser(id) {

        await db.query(
            "DELETE FROM users WHERE id = ?",
            [id]
        );

    }

};

module.exports = User;