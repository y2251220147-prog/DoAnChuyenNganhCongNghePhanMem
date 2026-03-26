const userService = require("../services/userService");
const authService = require("../services/authService");
const VALID_ROLES = ["admin", "organizer", "user"];

exports.getUsers = async (req, res) => {
    try { res.json(await userService.getAllUsers()); }
    catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

// FIX: tái dùng authService.register để tránh duplicate logic, sau đó set role nếu cần
exports.addUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
        return res.status(400).json({ message: "Name, email and password are required" });
    if (role && !VALID_ROLES.includes(role))
        return res.status(400).json({ message: `Role must be one of: ${VALID_ROLES.join(", ")}` });
    try {
        // Dùng register để tạo user (có đầy đủ validation: length, email exists, hash)
        const result = await authService.register({ name, email, password });
        // Nếu role khác "user", update role sau khi tạo
        if (role && role !== "user") {
            await userService.changeRole(result.userId, role);
        }
        res.status(201).json({ message: "User created", id: result.userId });
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

exports.changeRole = async (req, res) => {
    try {
        await userService.changeRole(req.params.id, req.body.role);
        res.json({ message: "Role updated" });
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

exports.deleteUser = async (req, res) => {
    try {
        await userService.deleteUser(req.params.id);
        res.json({ message: "User deleted" });
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await userService.getUserById(req.user.id);
        res.json(user);
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

exports.updateProfile = async (req, res) => {
    try {
        const updatedUser = await userService.updateProfile(req.user.id, req.body);
        res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};
