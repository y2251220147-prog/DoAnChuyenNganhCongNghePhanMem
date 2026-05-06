const EventDept = require("../models/eventDepartmentModel");
const db = require("../config/database");

exports.getAll = async () => await EventDept.getAll();

exports.getByEvent = async (eventId) => await EventDept.getByEvent(eventId);

exports.assign = async (data) => {
    const { event_id, department_id, role, note } = data;
    if (!event_id) throw { status: 400, message: "Vui lòng chọn sự kiện" };
    if (!department_id) throw { status: 400, message: "Vui lòng chọn phòng ban" };

    // Kiểm tra event tồn tại
    const [[event]] = await db.query("SELECT id, name FROM events WHERE id = ?", [event_id]);
    if (!event) throw { status: 404, message: "Không tìm thấy sự kiện" };

    // Kiểm tra dept tồn tại
    const [[dept]] = await db.query("SELECT id, name FROM departments WHERE id = ?", [department_id]);
    if (!dept) throw { status: 404, message: "Không tìm thấy phòng ban" };

    // Kiểm tra đã phân công chưa
    const existing = await EventDept.findByEventAndDept(event_id, department_id);
    if (existing) throw { status: 409, message: `Phòng ban "${dept.name}" đã được phân công vào sự kiện này rồi` };

    const id = await EventDept.create({ event_id, department_id, role, note });
    return {
        id,
        message: `Đã phân công phòng ban "${dept.name}" vào sự kiện "${event.name}"`
    };
};

exports.remove = async (id) => {
    const [rows] = await db.query(
        `SELECT ed.id, e.name AS event_name, d.name AS dept_name
         FROM event_departments ed
         LEFT JOIN events e ON ed.event_id = e.id
         LEFT JOIN departments d ON ed.department_id = d.id
         WHERE ed.id = ?`, [id]
    );
    if (!rows[0]) throw { status: 404, message: "Không tìm thấy phân công" };
    await EventDept.remove(id);
    return { message: `Đã xóa phân công phòng ban "${rows[0].dept_name}" khỏi sự kiện "${rows[0].event_name}"` };
};

exports.update = async (id, data) => {
    const [rows] = await db.query("SELECT id FROM event_departments WHERE id = ?", [id]);
    if (!rows[0]) throw { status: 404, message: "Không tìm thấy phân công" };
    await EventDept.update(id, data);
    return { message: "Cập nhật thành công" };
};
