const db = require("../config/database");

const Department = {
    getAll: async () => {
        const [rows] = await db.query(`
            SELECT d.*,
                   m.name  AS manager_name,
                   m.email AS manager_email,
                   COUNT(u.id) AS employee_count
            FROM departments d
            LEFT JOIN users m ON d.manager_id = m.id
            LEFT JOIN users u ON u.department_id = d.id
            GROUP BY d.id
            ORDER BY d.name ASC
        `);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query(`
            SELECT d.*,
                   m.name  AS manager_name,
                   m.email AS manager_email,
                   COUNT(u.id) AS employee_count
            FROM departments d
            LEFT JOIN users m ON d.manager_id = m.id
            LEFT JOIN users u ON u.department_id = d.id
            WHERE d.id = ?
            GROUP BY d.id
        `, [id]);
        return rows[0] || null;
    },

    findByName: async (name) => {
        const [rows] = await db.query("SELECT id FROM departments WHERE name = ?", [name]);
        return rows[0] || null;
    },

    create: async (data) => {
        const [r] = await db.query(
            "INSERT INTO departments (name, manager_id, description) VALUES (?, ?, ?)",
            [data.name, data.manager_id || null, data.description || null]
        );
        return r.insertId;
    },

    update: async (id, data) => {
        await db.query(
            "UPDATE departments SET name=?, manager_id=?, description=? WHERE id=?",
            [data.name, data.manager_id || null, data.description || null, id]
        );
    },

    delete: async (id) => {
        await db.query("DELETE FROM departments WHERE id=?", [id]);
    },

    // Nhân viên của phòng ban (kèm role_in_dept)
    getEmployees: async (deptId) => {
        const [rows] = await db.query(`
            SELECT id, name, email, role, position, role_in_dept, avatar, phone, gender
            FROM users
            WHERE department_id = ?
            ORDER BY name ASC
        `, [deptId]);
        return rows;
    },

    // Thêm user vào phòng ban (gán department_id)
    addEmployee: async (deptId, userId) => {
        await db.query("UPDATE users SET department_id = ? WHERE id = ?", [deptId, userId]);
    },

    // Xóa user khỏi phòng ban (xóa department_id)
    removeEmployee: async (deptId, userId) => {
        // Chỉ xóa nếu user đang thuộc đúng phòng ban này
        await db.query(
            "UPDATE users SET department_id = NULL, role_in_dept = NULL WHERE id = ? AND department_id = ?",
            [userId, deptId]
        );
    },

    // Lấy tất cả user role='user' chưa thuộc phòng ban nào (hoặc thuộc phòng khác) — dùng để thêm vào dept
    getUsersNotInDept: async (deptId) => {
        const [rows] = await db.query(`
            SELECT u.id, u.name, u.email, u.role, u.position, u.role_in_dept,
                   d.name AS current_dept_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.role = 'user' AND (u.department_id IS NULL OR u.department_id != ?)
            ORDER BY u.name ASC
        `, [deptId]);
        return rows;
    },

    // Lấy user không phải admin/organizer để chọn trưởng phòng
    getEligibleManagers: async () => {
        const [rows] = await db.query(`
            SELECT u.id, u.name, u.email, u.role, u.department_id, u.position, u.role_in_dept,
                   d.name AS current_dept_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.role = 'user'
            ORDER BY u.name ASC
        `);
        return rows;
    }
};

module.exports = Department;
