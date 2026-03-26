const Event = require("../models/eventModel");
const Deadline = require("../models/deadlineModel");
const NotificationService = require("./notificationService");
const Staff = require("../models/staffModel");
const Attendee = require("../models/attendeeModel");

// Workflow hợp lệ: chỉ cho phép chuyển trạng thái theo chiều này
const WORKFLOW = {
    draft: ["planning", "cancelled"],
    planning: ["approved", "cancelled"],
    approved: ["running", "cancelled"],
    running: ["completed", "cancelled"],
    completed: [],
    cancelled: []
};

const VALID_STATUSES = Object.keys(WORKFLOW);

// Deadline mặc định (ngày trước event)
const DEFAULT_DEADLINES = [
    { title: "Chốt concept", days_before: 10 },
    { title: "Chốt địa điểm", days_before: 7 },
    { title: "Hoàn thành marketing", days_before: 5 },
    { title: "Tổng duyệt", days_before: 1 },
];

const getAllEvents = async () => await Event.getAll();

const getEventById = async (id) => {
    const event = await Event.getById(id);
    if (!event) throw { status: 404, message: "Không tìm thấy sự kiện" };
    return event;
};

const createEvent = async (data, userId) => {
    const { name, start_date, end_date } = data;

    // Validate bắt buộc
    if (!name) throw { status: 400, message: "Tên sự kiện là bắt buộc" };
    if (!start_date) throw { status: 400, message: "Ngày bắt đầu là bắt buộc" };
    if (!end_date) throw { status: 400, message: "Ngày kết thúc là bắt buộc" };
    if (new Date(end_date) <= new Date(start_date))
        throw { status: 400, message: "Ngày kết thúc phải sau ngày bắt đầu" };

    // Người tạo = owner nếu không truyền owner_id
    const payload = { ...data, owner_id: data.owner_id || userId, status: "draft" };
    const id = await Event.create(payload);

    // Tự động tạo deadlines mặc định dựa vào start_date
    const start = new Date(start_date);
    for (const dl of DEFAULT_DEADLINES) {
        const due = new Date(start);
        due.setDate(due.getDate() - dl.days_before);
        await Deadline.create({ event_id: id, title: dl.title, due_date: due });
    }

    return { id };
};

const updateEvent = async (id, data) => {
    const event = await Event.getById(id);
    if (!event) throw { status: 404, message: "Không tìm thấy sự kiện" };

    // Không cho edit khi đang running/completed/cancelled
    if (["running", "completed", "cancelled"].includes(event.status))
        throw { status: 400, message: `Không thể chỉnh sửa sự kiện ở trạng thái "${event.status}"` };

    if (data.end_date && data.start_date &&
        new Date(data.end_date) <= new Date(data.start_date))
        throw { status: 400, message: "Ngày kết thúc phải sau ngày bắt đầu" };

    await Event.update(id, {
        name: data.name ?? event.name,
        description: data.description ?? event.description,
        event_type: data.event_type ?? event.event_type,
        owner_id: data.owner_id ?? event.owner_id,
        start_date: data.start_date ?? event.start_date,
        end_date: data.end_date ?? event.end_date,
        venue_type: data.venue_type ?? event.venue_type,
        location: data.location ?? event.location,
        capacity: data.capacity ?? event.capacity,
        total_budget: data.total_budget ?? event.total_budget,
        status: event.status, // status chỉ thay đổi qua changeStatus
    });

    try {
        const staff = await Staff.getByEvent(id);
        const attendees = await Attendee.getByEvent(id);
        const userIds = new Set();
        staff.forEach(s => s.user_id && userIds.add(s.user_id));
        attendees.forEach(a => a.user_id && userIds.add(a.user_id));
        
        if (userIds.size > 0) {
            await NotificationService.broadcast(Array.from(userIds), {
                type: "info",
                title: "Sự kiện được cập nhật",
                message: `Thông tin sự kiện "${event.name}" vừa được thay đổi.`,
                link: `/events/${id}`
            });
        }
    } catch (err) { console.error("Broadcast notification error:", err); }
};

// Chuyển trạng thái theo workflow — chỉ admin mới approve
const changeStatus = async (id, newStatus, userId, userRole) => {
    const event = await Event.getById(id);
    if (!event) throw { status: 404, message: "Không tìm thấy sự kiện" };

    if (!VALID_STATUSES.includes(newStatus))
        throw { status: 400, message: `Trạng thái không hợp lệ: ${newStatus}` };

    const allowed = WORKFLOW[event.status];
    if (!allowed.includes(newStatus))
        throw { status: 400, message: `Không thể chuyển từ "${event.status}" sang "${newStatus}"` };

    // Chỉ admin mới được approve
    if (newStatus === "approved" && userRole !== "admin")
        throw { status: 403, message: "Chỉ Admin mới có quyền duyệt sự kiện" };

    if (newStatus === "approved") {
        await Event.approve(id, userId);
    } else {
        await Event.changeStatus(id, newStatus);
    }

    try {
        const staff = await Staff.getByEvent(id);
        const attendees = await Attendee.getByEvent(id);
        const userIds = new Set();
        staff.forEach(s => s.user_id && userIds.add(s.user_id));
        attendees.forEach(a => a.user_id && userIds.add(a.user_id));
        
        const labels = { planning: "Lên kế hoạch", approved: "Đã duyệt", running: "Đang diễn ra", completed: "Hoàn thành", cancelled: "Đã hủy" };
        const statusName = labels[newStatus] || newStatus;

        if (userIds.size > 0) {
            await NotificationService.broadcast(Array.from(userIds), {
                type: newStatus === "cancelled" ? "warning" : "info",
                title: "Trạng thái sự kiện thay đổi",
                message: `Sự kiện "${event.name}" đã chuyển sang trạng thái: ${statusName}.`,
                link: `/events/${id}`
            });
        }
    } catch (err) { console.error("Broadcast notification error:", err); }
};

const deleteEvent = async (id) => {
    const event = await Event.getById(id);
    if (!event) throw { status: 404, message: "Không tìm thấy sự kiện" };
    if (["running", "completed"].includes(event.status))
        throw { status: 400, message: `Không thể xóa sự kiện đang ở trạng thái "${event.status}"` };
    await Event.delete(id);
};

// ── DEADLINES ─────────────────────────────────
const getDeadlines = async (eventId) => {
    await getEventById(eventId); // check tồn tại
    return await Deadline.getByEvent(eventId);
};

const createDeadline = async (eventId, data) => {
    await getEventById(eventId);
    const { title, due_date } = data;
    if (!title || !due_date)
        throw { status: 400, message: "Tiêu đề và hạn chót là bắt buộc" };
    const id = await Deadline.create({ event_id: eventId, ...data });
    return { id };
};

const toggleDeadline = async (deadlineId, done) => {
    await Deadline.toggleDone(deadlineId, done);
};

const deleteDeadline = async (deadlineId) => {
    await Deadline.delete(deadlineId);
};

module.exports = {
    getAllEvents, getEventById,
    createEvent, updateEvent, changeStatus, deleteEvent,
    getDeadlines, createDeadline, toggleDeadline, deleteDeadline,
};
