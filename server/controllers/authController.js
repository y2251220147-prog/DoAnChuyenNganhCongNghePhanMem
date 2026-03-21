const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_production";

exports.register = async (req, res) => {
    const { name, email, password } = req.body;
    // role luôn là "user" khi tự đăng ký - không cho chọn role
    try {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = await User.createUser({ name, email, password: hashedPassword, role: "user" });
        res.status(201).json({ message: "Register success", userId: id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: "8h" }
        );
        res.json({ message: "Login success", token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.verifyToken = async (req, res) => {
    try {
        res.json({ message: "Token valid", user: req.user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const match = await bcrypt.compare(oldPassword, user.password);
        if (!match) {
            return res.status(400).json({ message: "Old password incorrect" });
        }
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(req.user.id, hashedPassword);
        res.json({ message: "Password updated" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.seedAdmin = async (req, res) => {
    try {
        const bcrypt = require("bcrypt");
        const [existing] = require("../config/database").query
            ? await require("../config/database").query("SELECT COUNT(*) as count FROM users")
            : [[{ count: 1 }]];

        const db = require("../config/database");
        const [[{ count }]] = await db.query("SELECT COUNT(*) as count FROM users");

        if (count > 0) {
            return res.status(403).json({ message: "Seed only allowed on empty database" });
        }

        const hashed = await bcrypt.hash("admin123", 10);
        await db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            ["Super Admin", "admin@eventpro.com", hashed, "admin"]
        );

        res.json({
            message: "Admin account created",
            email: "admin@eventpro.com",
            password: "admin123"
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
