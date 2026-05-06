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
        // Dùng register để tạo user (có đầy đủ validation)
        const result = await authService.register({ name, email, password });
        // Update role & department sau khi tạo
        if (role && role !== "user") {
            await userService.changeRole(result.userId, role);
        }
        if (req.body.department_id) {
            await userService.changeDepartment(result.userId, req.body.department_id);
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

exports.changeDepartment = async (req, res) => {
    try {
        await userService.changeDepartment(req.params.id, req.body.department_id);
        res.json({ message: "Department updated" });
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

exports.deleteUser = async (req, res) => {
    try {
        await userService.deleteUser(req.params.id);
        res.json({ message: "User deleted" });
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

// --- AUTHENTICATED PROFILE ACTIONS ---

exports.getProfile = async (req, res) => {
    try {
        const user = await userService.getUserById(req.user.id);
        res.json(user);
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

exports.updateProfile = async (req, res) => {
    const { name, phone, gender, address } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    
    try {
        const updatedUser = await userService.updateUserProfile(req.user.id, { 
            name, phone, gender, address 
        });
        res.json({ message: "Profile updated", user: updatedUser });
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};
