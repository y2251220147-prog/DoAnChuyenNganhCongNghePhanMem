const bcrypt = require("bcrypt");
const User = require("../models/userModel");

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
    try {
        await User.updateRole(id, role);
        res.json({ message: "Role updated" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: user.address,
            gender: user.gender,
            is_verified: user.is_verified
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    const { name, email, phone, address, gender } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (email && email !== user.email) {
            const existing = await User.findByEmail(email);
            if (existing) {
                return res.status(400).json({ message: "Email already in use" });
            }
        }

        // Prepare finalized data object
        const updatedData = {
            name: name !== undefined ? name : user.name,
            email: email !== undefined ? email : user.email,
            phone: phone !== undefined ? phone : user.phone,
            address: address !== undefined ? address : user.address,
            gender: gender !== undefined ? gender : user.gender
        };

        await User.updateUser(req.user.id, updatedData);

        res.json({ message: "Profile updated" });

    } catch (err) {
        console.error("[USER ERROR] updateProfile failed:", err);
        res.status(500).json({ message: err.message });
    }
};

exports.createUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const existing = await User.findByEmail(email);
        if (existing) {
            return res.status(400).json({ message: "Email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = await User.createUser({
            name,
            email,
            password: hashedPassword,
            role: role || "user",
            phone: req.body.phone,
            address: req.body.address,
            gender: req.body.gender
        });
        res.json({ message: "User created", userId: id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address, gender } = req.body;
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (email && email !== user.email) {
            const existing = await User.findByEmail(email);
            if (existing) {
                return res.status(400).json({ message: "Email already in use" });
            }
        }
        await User.updateUser(id, {
            name: name || user.name,
            email: email || user.email,
            phone: phone || user.phone,
            address: address || user.address,
            gender: gender || user.gender
        });
        res.json({ message: "User updated" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        await User.deleteUser(id);
        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};