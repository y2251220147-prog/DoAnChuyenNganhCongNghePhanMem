const Staff = require("../models/staffModel");
const db = require("../config/database");

exports.getAllStaff = async () => await Staff.getAll();

exports.getStaffByEvent = async (eventId) => await Staff.getByEvent(eventId);

exports.assignStaff = async (data) => {
    const { event_id, user_id, role } = data;
    if (!event_id) throw { status: 400, message: "Vui lòng chọn sự kiện" };
    if (!user_id) throw { status: 400, message: "Vui lòng chọn nhân sự" };

    // Kiểm tra đã assign chưa
    const existing = await Staff.findByEventAndUser(event_id, user_id);
    if (existing) throw { status: 409, message: "Nhân sự này đã được phân công vào sự kiện" };

    const id = await Staff.assign({ event_id, user_id, role: role || "volunteer" });
    return { id };
};

exports.assignByDepartment = async (data) => {
    const { event_id, department_id, role } = data;
    if (!event_id) throw { status: 400, message: "Vui lòng chọn sự kiện" };
    if (!department_id) throw { status: 400, message: "Vui lòng chọn phòng ban" };

    // Kiểm tra phòng ban tồn tại
    const [[dept]] = await db.query(
        "SELECT id, name FROM departments WHERE id = ?", [department_id]
    );
    if (!dept) throw { status: 404, message: "Không tìm thấy phòng ban" };

    const result = await Staff.assignByDepartment(event_id, department_id, role || "volunteer");

    if (result.total === 0) {
        throw { status: 400, message: `Phòng ban "${dept.name}" chưa có nhân viên nào` };
    }

    return {
        message: `Phân công thành công ${result.assigned} nhân viên từ phòng "${dept.name}"`,
        assigned: result.assigned,
        skipped: result.skipped,
        total: result.total
    };
};

exports.removeStaff = async (id) => await Staff.remove(id);
