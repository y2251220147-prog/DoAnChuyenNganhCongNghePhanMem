const User = require("../models/userModel");
const bcrypt = require("bcrypt");

const VALID_ROLES = ["user", "organizer", "admin"];

exports.getUsers = async (req, res) => {
    try {
        const users = await User.getAllUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.changeRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
    }
    try {
        await User.updateRole(id, role);
        res.json({ message: "Role updated" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (role && !VALID_ROLES.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
    }
    try {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = await User.createUser({ name, email, password: hashedPassword, role: role || "user" });
        res.status(201).json({ message: "User created", id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
