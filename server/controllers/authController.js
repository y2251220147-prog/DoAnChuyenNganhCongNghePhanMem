const authService = require("../services/authService");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");

exports.register = async (req, res) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json({ message: "Register success", ...result });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const result = await authService.login(req.body);
        res.json({ message: "Login success", ...result });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.verifyToken = async (req, res) => {
    res.json({ message: "Token valid", user: req.user });
};

exports.resetPassword = async (req, res) => {
    try {
        await authService.resetPassword(req.user.id, req.body);
        res.json({ message: "Password updated" });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

// POST /api/auth/seed — chỉ chạy khi DB users rỗng
exports.seedAdmin = async (req, res) => {
    try {
        const [[{ count }]] = await require("../config/database").query("SELECT COUNT(*) as count FROM users");
        if (count > 0) return res.status(403).json({ message: "Seed only allowed on empty database" });

        const hashed = await bcrypt.hash("admin123", 10);
        await User.createUser({ name: "Super Admin", email: "admin@eventpro.com", password: hashed, role: "admin" });

        // FIX: Không trả password trong response
        res.json({
            message: "Admin created successfully. Please login and change the password immediately.",
            email: "admin@eventpro.com",
            note: "Default password has been set. Contact your system administrator for credentials."
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
