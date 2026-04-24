const Event = require("../models/eventModel");
const Deadline = require("../models/deadlineModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");

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

    // Thông báo cho admin
    const { notifyAdmins } = require("./notificationUtils");
    await notifyAdmins({
        type: 'event_reminder',
        title: 'Sự kiện mới chờ duyệt',
        message: `Sự kiện "${name}" vừa được lên nháp. Vui lòng kiểm tra và phê duyệt.`,
        link: `/events/${id}`
    });

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
        // Thông báo cho tất cả nhân viên (role=user) về sự kiện mới
        try {
            const allUsers = await User.getAllUsers();
            const employees = allUsers.filter(u => u.role === 'user');
            for (const u of employees) {
                await Notification.create({
                    user_id: u.id,
                    type: 'event_reminder',
                    title: `Sự kiện mới: ${event.name}`,
                    message: `Sự kiện "${event.name}" đã được phê duyệt và mở đăng ký. Đừng bỏ lỡ!`,
                    link: `/events/${id}`
                });
            }
        } catch (e) { console.error("Thông báo lỗi:", e); }
    } else {
        await Event.changeStatus(id, newStatus);
        
        // Nếu hủy sự kiện (có thể do organizer hủy)
        if (newStatus === "cancelled") {
            const { notifyAdmins } = require("./notificationUtils");
            await notifyAdmins({
                type: 'status_change',
                title: 'Sự kiện bị hủy',
                message: `Sự kiện "${event.name}" đã bị hủy.`,
                link: `/events/${id}`
            });
        }
    }
};

const deleteEvent = async (id) => {
    const event = await Event.getById(id);
    if (!event) throw { status: 404, message: "Không tìm thấy sự kiện" };
    // Không thể xóa sự kiện đã duyệt, đang chạy hoặc đã hoàn thành
    if (["approved", "running", "completed"].includes(event.status))
        throw { status: 400, message: `Không thể xóa sự kiện ở trạng thái "${event.status}". Hãy hủy sự kiện trước.` };
    await Event.delete(id);

    const { notifyAdmins } = require("./notificationUtils");
    await notifyAdmins({
        type: 'status_change',
        title: 'Sự kiện đã bị xóa',
        message: `Sự kiện "${event.name}" vừa bị xóa khỏi hệ thống.`,
        link: '/events'
    });
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

const broadcastNotification = async (eventId, data) => {
    const { broadcast } = require("./notificationService");
    const db = require("../config/db");
    const [rows] = await db.execute(
        "SELECT user_id FROM attendees WHERE event_id = ? AND user_id IS NOT NULL", 
        [eventId]
    );
    const userIds = rows.map(r => r.user_id);
    if (userIds.length > 0) {
        await broadcast(userIds, { ...data, link: `/events/${eventId}` });
    }
    return { notifiedCount: userIds.length };
};

module.exports = {
    getAllEvents, getEventById,
    createEvent, updateEvent, changeStatus, deleteEvent,
    getDeadlines, createDeadline, toggleDeadline, deleteDeadline,
    broadcastNotification
};
