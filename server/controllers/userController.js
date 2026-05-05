const userService = require("../services/userService");
const authService = require("../services/authService");
const VALID_ROLES = ["admin", "organizer", "user"];

exports.getUsers = async (req, res) => {
    try { res.json(await userService.getAllUsers()); }
    catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

// Trả về danh sách users chưa đăng ký tham gia (attendee nội bộ) cho event này
// Chỉ ẩn người đã TỰ ĐĂNG KÝ tham gia (attendee_type = 'internal')
// Không ẩn theo event_staff để tránh loại trừ quá nhiều người
exports.getUsersAvailableForEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const db = require("../config/database");
        const [rows] = await db.query(`
            SELECT u.id, u.name, u.email, u.role, u.department_id,
                   d.name AS department_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.id NOT IN (
                -- Chỉ ẩn nhân viên nội bộ đã đăng ký tham gia sự kiện này
                SELECT a.user_id FROM attendees a
                WHERE a.event_id = ?
                  AND a.user_id IS NOT NULL
                  AND a.attendee_type = 'internal'
            )
            ORDER BY u.name ASC
        `, [eventId]);
        res.json(rows);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};


// FIX: tái dùng authService.register để tránh duplicate logic, sau đó set role nếu cần
exports.addUser = async (req, res) => {
    const { name, email, password, role, department_id } = req.body;
    if (!name || !email || !password)
        return res.status(400).json({ message: "Name, email and password are required" });
    if (role && !VALID_ROLES.includes(role))
        return res.status(400).json({ message: `Role must be one of: ${VALID_ROLES.join(", ")}` });
    try {
        // Dùng register để tạo user (có đầy đủ validation: length, email exists, hash)
        const result = await authService.register({ name, email, password, department_id });
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

exports.changeDepartment = async (req, res) => {
    try {
        const { department_id, position } = req.body;
        await userService.changeDepartment(req.params.id, department_id, position);
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
    const { name, phone, gender, address, department_id } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    
    try {
        const updatedUser = await userService.updateUserProfile(req.user.id, { 
            name, phone, gender, address, department_id 
        });
        res.json({ message: "Profile updated", user: updatedUser });
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};
