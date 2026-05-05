const Department = require("../models/departmentModel");
const db = require("../config/database");

// Helper: cập nhật role_in_dept cho user
const syncManagerRole = async (userId, deptName) => {
    if (!userId) return;
    await db.query(
        "UPDATE users SET role_in_dept = ? WHERE id = ?",
        [deptName ? `Trưởng phòng ${deptName}` : null, userId]
    );
};

// Helper: xóa role trưởng phòng của user cũ
const clearOldManagerRole = async (oldManagerId, deptName) => {
    if (!oldManagerId) return;
    await db.query(
        "UPDATE users SET role_in_dept = NULL WHERE id = ? AND role_in_dept = ?",
        [oldManagerId, `Trưởng phòng ${deptName}`]
    );
};

exports.getAll = async () => await Department.getAll();

exports.getById = async (id) => {
    const dept = await Department.findById(id);
    if (!dept) throw { status: 404, message: "Không tìm thấy phòng ban" };
    return dept;
};

exports.getEligibleManagers = async () => await Department.getEligibleManagers();

exports.getEmployees = async (id) => {
    const dept = await Department.findById(id);
    if (!dept) throw { status: 404, message: "Không tìm thấy phòng ban" };
    return { department: dept, employees: await Department.getEmployees(id) };
};

// Lấy danh sách user chưa thuộc phòng này (để thêm vào)
exports.getAvailableUsers = async (id) => {
    const dept = await Department.findById(id);
    if (!dept) throw { status: 404, message: "Không tìm thấy phòng ban" };
    return await Department.getUsersNotInDept(id);
};

// Thêm nhân viên vào phòng ban
exports.addEmployee = async (deptId, userId) => {
    const dept = await Department.findById(deptId);
    if (!dept) throw { status: 404, message: "Không tìm thấy phòng ban" };

    // Kiểm tra user tồn tại và là role='user'
    const [[user]] = await db.query("SELECT id, name, role, department_id FROM users WHERE id = ?", [userId]);
    if (!user) throw { status: 404, message: "Không tìm thấy người dùng" };
    if (user.role === "admin" || user.role === "organizer")
        throw { status: 400, message: "Admin và Organizer không thể được thêm vào phòng ban" };
    if (user.department_id === Number(deptId))
        throw { status: 400, message: "Người dùng đã thuộc phòng ban này" };

    await Department.addEmployee(deptId, userId);
    return { message: `Đã thêm ${user.name} vào phòng ban ${dept.name}` };
};

// Xóa nhân viên khỏi phòng ban
exports.removeEmployee = async (deptId, userId) => {
    const dept = await Department.findById(deptId);
    if (!dept) throw { status: 404, message: "Không tìm thấy phòng ban" };

    const [[user]] = await db.query("SELECT id, name, department_id FROM users WHERE id = ?", [userId]);
    if (!user) throw { status: 404, message: "Không tìm thấy người dùng" };
    if (user.department_id !== Number(deptId))
        throw { status: 400, message: "Người dùng không thuộc phòng ban này" };

    // Nếu user là trưởng phòng → xóa cả chức danh
    if (dept.manager_id === Number(userId)) {
        await db.query("UPDATE departments SET manager_id = NULL WHERE id = ?", [deptId]);
        await clearOldManagerRole(userId, dept.name);
    }

    await Department.removeEmployee(deptId, userId);
    return { message: `Đã xóa ${user.name} khỏi phòng ban` };
};

// Cập nhật role_in_dept của nhân viên trong phòng ban
exports.updateEmployeeRole = async (deptId, userId, role_in_dept) => {
    const dept = await Department.findById(deptId);
    if (!dept) throw { status: 404, message: "Không tìm thấy phòng ban" };

    const [[user]] = await db.query("SELECT id, name, department_id FROM users WHERE id = ?", [userId]);
    if (!user) throw { status: 404, message: "Không tìm thấy người dùng" };
    if (user.department_id !== Number(deptId))
        throw { status: 400, message: "Người dùng không thuộc phòng ban này" };

    // Không cho ghi đè "Trưởng phòng" thủ công (đó là role tự động)
    if (dept.manager_id === Number(userId)) {
        throw { status: 400, message: "Không thể sửa chức danh trưởng phòng tại đây. Hãy thay đổi trưởng phòng ở phần thông tin phòng ban." };
    }

    await db.query("UPDATE users SET role_in_dept = ? WHERE id = ?", [role_in_dept || null, userId]);
    return { message: "Cập nhật chức danh thành công" };
};

exports.create = async (data) => {
    const { name, description, manager_id } = data;
    if (!name?.trim()) throw { status: 400, message: "Tên phòng ban là bắt buộc" };

    const existing = await Department.findByName(name.trim());
    if (existing) throw { status: 409, message: "Tên phòng ban đã tồn tại" };

    if (manager_id) {
        const [[mgr]] = await db.query("SELECT id, name, role FROM users WHERE id = ?", [manager_id]);
        if (!mgr) throw { status: 404, message: "Không tìm thấy người dùng được chọn làm trưởng phòng" };
        if (mgr.role === "admin" || mgr.role === "organizer")
            throw { status: 400, message: "Admin và Organizer không thể được chọn làm trưởng phòng" };

        const existingDept = await Department.findByManager(manager_id);
        if (existingDept) throw { status: 400, message: `Người này đã là trưởng phòng của "${existingDept.name}"` };
    }

    const id = await Department.create({ name: name.trim(), description, manager_id: manager_id || null });

    if (manager_id) {
        await syncManagerRole(manager_id, name.trim());
        // Đảm bảo trưởng phòng thuộc phòng ban này (chuyển phòng nếu cần)
        await db.query("UPDATE users SET department_id = ? WHERE id = ?", [id, manager_id]);
    }

    return { id };
};

exports.update = async (id, data) => {
    const { name, description, manager_id } = data;
    if (!name?.trim()) throw { status: 400, message: "Tên phòng ban là bắt buộc" };

    const dept = await Department.findById(id);
    if (!dept) throw { status: 404, message: "Không tìm thấy phòng ban" };

    const existing = await Department.findByName(name.trim());
    if (existing && existing.id !== Number(id))
        throw { status: 409, message: "Tên phòng ban đã tồn tại" };

    if (manager_id) {
        const [[mgr]] = await db.query("SELECT id, name, role FROM users WHERE id = ?", [manager_id]);
        if (!mgr) throw { status: 404, message: "Không tìm thấy người dùng được chọn làm trưởng phòng" };
        if (mgr.role === "admin" || mgr.role === "organizer")
            throw { status: 400, message: "Admin và Organizer không thể được chọn làm trưởng phòng" };

        const existingDept = await Department.findByManager(manager_id);
        if (existingDept && existingDept.id !== Number(id)) 
            throw { status: 400, message: `Người này đã là trưởng phòng của "${existingDept.name}"` };
    }

    const oldManagerId = dept.manager_id;
    const oldName = dept.name;
    const newManagerId = manager_id ? Number(manager_id) : null;

    await Department.update(id, { name: name.trim(), description, manager_id: newManagerId });

    if (oldManagerId !== newManagerId) {
        if (oldManagerId) await clearOldManagerRole(oldManagerId, oldName);
        if (newManagerId) {
            await syncManagerRole(newManagerId, name.trim());
            // Đảm bảo trưởng phòng mới thuộc phòng ban này (chuyển phòng nếu cần)
            await db.query("UPDATE users SET department_id = ? WHERE id = ?", [id, newManagerId]);
        }
    } else if (oldManagerId && oldName !== name.trim()) {
        await syncManagerRole(oldManagerId, name.trim());
    }
};

exports.delete = async (id) => {
    const dept = await Department.findById(id);
    if (!dept) throw { status: 404, message: "Không tìm thấy phòng ban" };
    if (dept.employee_count > 0)
        throw { status: 400, message: "Không thể xóa phòng ban đang có nhân viên. Hãy chuyển nhân viên sang phòng ban khác trước." };

    if (dept.manager_id) await clearOldManagerRole(dept.manager_id, dept.name);

    await Department.delete(id);
};
