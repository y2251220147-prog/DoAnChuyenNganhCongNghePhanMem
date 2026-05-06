const Venue = require("../models/venueModel");
const Event = require("../models/eventModel");

exports.getAll = async () => await Venue.getAll();
exports.getById = async (id) => {
    const v = await Venue.getById(id);
    if (!v) throw { status: 404, message: "Không tìm thấy địa điểm" };
    return v;
};
exports.create = async (data, userId) => {
    if (!data.name) throw { status: 400, message: "Tên địa điểm là bắt buộc" };
    const id = await Venue.create({ ...data, created_by: userId });
    return { id };
};
exports.update = async (id, data) => {
    await exports.getById(id);
    await Venue.update(id, data);
};
exports.delete = async (id) => {
    await exports.getById(id);
    await Venue.delete(id);
};
exports.getEventBookings = async (eventId) => await Venue.getEventBookings(eventId);
exports.bookVenue = async (data) => {
    if (!data.event_id || !data.venue_id || !data.start_time || !data.end_time)
        throw { status: 400, message: "event_id, venue_id, start_time, end_time là bắt buộc" };
    if (new Date(data.end_time) <= new Date(data.start_time))
        throw { status: 400, message: "Thời gian kết thúc phải sau thời gian bắt đầu" };

    // Validate venue tồn tại
    const venue = await Venue.getById(data.venue_id);
    if (!venue) throw { status: 404, message: "Không tìm thấy địa điểm" };

    // Kiểm tra xung đột thời gian (chỉ với các booking đã confirmed)
    const conflict = await Venue.checkConflict(data.venue_id, data.start_time, data.end_time);
    if (conflict) {
        const start = new Date(conflict.start_time).toLocaleString('vi-VN');
        const end   = new Date(conflict.end_time).toLocaleString('vi-VN');
        throw {
            status: 409,
            message: `Địa điểm đã được đặt cho sự kiện "${conflict.event_name}" từ ${start} đến ${end}`
        };
    }

    const id = await Venue.createBooking(data);
    return { id };
};
exports.updateBookingStatus = async (id, status) => {
    const Notification = require("../models/notificationModel");
    const booking = await Venue.getBookingById(id);
    if (!booking) throw { status: 404, message: "Không tìm thấy yêu cầu đặt chỗ" };

    await Venue.updateBookingStatus(id, status);

    // Thông báo cho Người sở hữu sự kiện (Organizer)
    if (booking.owner_id) {
        try {
            const statusText = status === 'confirmed' ? 'đã được XÁC NHẬN ✅' : 'đã bị TỪ CHỐI ❌';
            await Notification.create({
                user_id: booking.owner_id,
                type: 'status_change',
                title: 'Cập nhật trạng thái đặt địa điểm',
                message: `Yêu cầu đặt địa điểm "${booking.venue_name}" cho sự kiện "${booking.event_name}" ${statusText}.`,
                link: `/events/${booking.event_id}?tab=venue`
            });
        } catch (e) { console.error("Lỗi thông báo Organizer (venue booking):", e); }
    }
};
exports.deleteBooking = async (id) => { await Venue.deleteBooking(id); };

exports.getResourcesByEvent = async (eventId) => {
    const Resource = require("../models/resourceModel");
    return await Resource.getEventBookings(eventId);
};
exports.getAllResources = async () => {
    const Resource = require("../models/resourceModel");
    return await Resource.getAll();
};
exports.createResource = async (data) => {
    const Resource = require("../models/resourceModel");
    if (!data.name) throw { status: 400, message: "Tên tài nguyên là bắt buộc" };
    const id = await Resource.create(data);
    return { id };
};
exports.updateResource = async (id, data) => {
    const Resource = require("../models/resourceModel");
    await Resource.update(id, data);
};
exports.deleteResource = async (id) => {
    const Resource = require("../models/resourceModel");
    await Resource.delete(id);
};
exports.bookResource = async (data) => {
    const Resource = require("../models/resourceModel");
    if (!data.event_id || !data.resource_id)
        throw { status: 400, message: "event_id và resource_id là bắt buộc" };
    const id = await Resource.createBooking(data);
    return { id };
};
exports.updateResourceBookingStatus = async (id, status) => {
    const Resource = require("../models/resourceModel");
    await Resource.updateBookingStatus(id, status);
};
exports.deleteResourceBooking = async (id) => {
    const Resource = require("../models/resourceModel");
    await Resource.deleteBooking(id);
};
