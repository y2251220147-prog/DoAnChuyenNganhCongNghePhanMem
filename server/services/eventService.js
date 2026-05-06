const Event = require("../models/eventModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const Venue = require("../models/venueModel");
const Resource = require("../models/resourceModel");

// Workflow hợp lệ
const WORKFLOW = {
    draft: ["planning", "cancelled"],
    planning: ["approved", "cancelled"],
    approved: ["running", "cancelled"],
    running: ["completed", "cancelled"],
    completed: [],
    cancelled: []
};

const VALID_STATUSES = Object.keys(WORKFLOW);

const getAllEvents = async () => await Event.getAll();

const searchEvents = async (params) => {
    return await Event.search(params);
};

const getEventById = async (id) => {
    const event = await Event.getById(id);
    if (!event) throw { status: 404, message: "Không tìm thấy sự kiện" };
    return event;
};

const createEvent = async (data, userId) => {
    const { name, start_date, end_date } = data;

    if (!name) throw { status: 400, message: "Tên sự kiện là bắt buộc" };
    if (!start_date) throw { status: 400, message: "Ngày bắt đầu là bắt buộc" };
    if (!end_date) throw { status: 400, message: "Ngày kết thúc là bắt buộc" };
    if (new Date(end_date) <= new Date(start_date))
        throw { status: 400, message: "Ngày kết thúc phải sau ngày bắt đầu" };

    const payload = { 
        ...data, 
        owner_id: data.owner_id || userId, 
        status: "draft",
        venue_id: data.venue_id ? Number(data.venue_id) : null
    };
    const id = await Event.create(payload);

    if (payload.venue_id && payload.venue_type === 'offline') {
        try {
            await Venue.createBooking({
                event_id: id,
                venue_id: payload.venue_id,
                start_time: start_date,
                end_time: end_date,
                note: `Đặt chỗ tự động từ sự kiện: ${name}`,
                status: 'confirmed'
            });
        } catch (e) { console.error("Lỗi tự động đặt địa điểm:", e); }
    }

    if (data.resources && Array.isArray(data.resources)) {
        for (const res of data.resources) {
            try {
                await Resource.createBooking({
                    event_id: id,
                    resource_id: res.resource_id || res.id,
                    quantity: res.quantity || 1,
                    status: 'confirmed'
                });
            } catch (e) { console.error("Lỗi tự động đặt tài nguyên:", e); }
        }
    }

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
        organizer_id: data.organizer_id ?? event.organizer_id,
        manager_id: data.manager_id ?? event.manager_id,
        tracker_id: data.tracker_id ?? event.tracker_id,
        coordination_unit: data.coordination_unit ?? event.coordination_unit,
        venue_id: data.venue_id ? Number(data.venue_id) : event.venue_id,
        status: event.status,
    });

    const newVenueId = data.venue_id ?? event.venue_id;
    const newStart = data.start_date ?? event.start_date;
    const newEnd = data.end_date ?? event.end_date;

    if (newVenueId && (data.venue_id || data.start_date || data.end_date)) {
        try {
            const db = require("../config/database");
            await db.query("DELETE FROM event_venue_bookings WHERE event_id = ?", [id]);
            await Venue.createBooking({
                event_id: id,
                venue_id: newVenueId,
                start_time: newStart,
                end_time: newEnd,
                status: 'confirmed'
            });
        } catch (e) { console.error("Lỗi cập nhật booking địa điểm:", e); }
    }

    if (['approved', 'planning', 'running'].includes(event.status)) {
        try {
            const db = require("../config/database");
            const [attRows] = await db.query("SELECT user_id FROM attendees WHERE event_id = ? AND user_id IS NOT NULL", [id]);
            for (const r of attRows) {
                await Notification.create({
                    user_id: r.user_id,
                    type: 'status_change',
                    title: `Thay đổi thông tin: ${event.name}`,
                    message: `Ban tổ chức vừa cập nhật thông tin sự kiện "${event.name}". Bạn hãy kiểm tra lại thời gian/địa điểm nhé.`,
                    link: `/events/${id}`
                });
            }
        } catch (err) { console.error("Lỗi gửi thông báo đổi sự kiện:", err); }
    }
};

const changeStatus = async (id, newStatus, userId, userRole) => {
    const event = await Event.getById(id);
    if (!event) throw { status: 404, message: "Không tìm thấy sự kiện" };

    if (!VALID_STATUSES.includes(newStatus))
        throw { status: 400, message: `Trạng thái không hợp lệ: ${newStatus}` };

    const allowed = WORKFLOW[event.status];
    if (!allowed.includes(newStatus))
        throw { status: 400, message: `Không thể chuyển từ "${event.status}" sang "${newStatus}"` };

    if (newStatus === "approved" && userRole !== "admin")
        throw { status: 403, message: "Chỉ Admin mới có quyền duyệt sự kiện" };

    if (newStatus === "approved") {
        await Event.approve(id, userId);
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

module.exports = {
    getAllEvents, getEventById,
    createEvent, updateEvent, changeStatus, deleteEvent,
    searchEvents,
};

