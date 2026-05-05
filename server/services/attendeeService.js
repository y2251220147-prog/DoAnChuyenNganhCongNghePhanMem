const Attendee = require("../models/attendeeModel");
const Event = require("../models/eventModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const { generateQR } = require("./qrService");
const { sendGuestInvitation } = require("./emailService");

const isEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

exports.getAllAttendees = async () => await Attendee.getAll();
exports.getByEvent = async (id) => await Attendee.getByEvent(id);
exports.getStats = async (id) => await Attendee.getStats(id);
exports.getMyRegistrations = async (userId) => await Attendee.getByUser(userId);

exports.checkRegistration = async (eventId, userId) => {
    const att = await Attendee.findByUserAndEvent(userId, eventId);
    return { registered: !!att, attendee: att };
};

exports.addExternal = async (data, registeredBy) => {
    const { event_id, name, email, phone } = data;
    if (!event_id || !name || !email) throw { status: 400, message: "event_id, name và email là bắt buộc" };
    if (!isEmail(email)) throw { status: 400, message: "Email không hợp lệ" };
    const event = await Event.getById(event_id);
    if (!event) throw { status: 404, message: "Không tìm thấy sự kiện" };
    if (['completed', 'cancelled'].includes(event.status))
        throw { status: 400, message: `Không thể thêm khách vào sự kiện đã kết thúc hoặc đã huỷ` };
    const dup = await Attendee.findByEmailAndEvent(email, event_id);
    if (dup) throw { status: 409, message: "Email này đã đăng ký sự kiện rồi" };
    const qr_code = generateQR(event_id, name);
    const id = await Attendee.create({
        event_id, user_id: null, name, email, phone,
        attendee_type: 'external', qr_code, registered_by: registeredBy
    });
    
    let emailSent = false;
    try {
        await sendGuestInvitation({
            name, email, qr_code,
            custom_message: data.content,
            event: {
                name: event.name,
                start_date: event.start_date,
                end_date: event.end_date,
                location: event.location,
                venue_type: event.venue_type,
                event_type: event.event_type,
                description: event.description,
            }
        });
        emailSent = true;
    } catch (err) {
        console.error(`Lỗi gửi email cho ${email}:`, err.message);
    }
    
    return { id, qr_code, emailSent };
};

exports.addBulkExternal = async (dataList, registeredBy) => {
    if (!Array.isArray(dataList) || dataList.length === 0) {
        throw { status: 400, message: "Danh sách khách mời không hợp lệ" };
    }
    
    let successCount = 0;
    let errors = [];
    
    for (const [index, data] of dataList.entries()) {
        try {
            await exports.addExternal(data, registeredBy);
            successCount++;
        } catch (e) {
            errors.push({ line: index + 1, email: data.email, error: e.message });
        }
    }
    
    return { 
        stats: { success: successCount, failed: errors.length },
        errors 
    };
};

exports.selfRegister = async (eventId, userId) => {
    const event = await Event.getById(eventId);
    if (!event) throw { status: 404, message: "Không tìm thấy sự kiện" };
    if (!['approved', 'running'].includes(event.status))
        throw { status: 400, message: "Sự kiện chưa mở đăng ký" };
    if (event.capacity) {
        const stats = await Attendee.getStats(eventId);
        if (stats.total >= event.capacity) throw { status: 400, message: "Đã đủ số lượng người tham gia" };
    }
    const dup = await Attendee.findByUserAndEvent(userId, eventId);
    if (dup) throw { status: 409, message: "Bạn đã đăng ký sự kiện này rồi" };
    const user = await User.findById(userId);
    if (!user) throw { status: 404, message: "Không tìm thấy user" };
    const qr_code = generateQR(eventId, user.name);
    const id = await Attendee.create({
        event_id: eventId, user_id: userId, name: user.name, email: user.email,
        attendee_type: 'internal', qr_code, registered_by: userId
    });

    // Thông báo xác nhận đăng ký thành công
    try {
        await Notification.create({
            user_id: userId,
            type: 'checkin',
            title: `Đăng ký thành công: ${event.name}`,
            message: `Bạn đã đăng ký tham gia "${event.name}". Hãy kiểm tra mã QR trong Sự kiện của tôi.`,
            link: `/my-events`
        });
    } catch (e) { console.error("Lỗi thông báo đăng ký:", e); }

    return { id, qr_code };
};

exports.remove = async (attendeeId, requesterId, requesterRole) => {
    const att = await Attendee.findById(attendeeId);
    if (!att) throw { status: 404, message: "Không tìm thấy người tham gia" };
    if (requesterRole === 'user' && att.user_id !== requesterId)
        throw { status: 403, message: "Bạn không có quyền xoá người này" };
    if (att.checked_in && requesterRole === 'user')
        throw { status: 400, message: "Không thể huỷ sau khi đã check-in" };
    await Attendee.delete(attendeeId);
};

exports.lookupByEmail = async (email) => {
    if (!email || !isEmail(email)) throw { status: 400, message: "Email không hợp lệ" };
    const rows = await Attendee.findByEmail(email);
    if (!rows.length) throw { status: 404, message: "Không tìm thấy khách mời với email này" };
    return rows.map(r => ({
        guest: {
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone,
            qr_code: r.qr_code,
            checked_in: r.checked_in,
            event_id: r.event_id,
        },
        event: {
            id: r.event_id,
            name: r.event_name,
            status: r.event_status,
            start_date: r.start_date,
            end_date: r.end_date,
            location: r.location,
        }
    }));
};
