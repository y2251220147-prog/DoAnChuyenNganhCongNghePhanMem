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
    return { id, qr_code };
};

exports.bulkInvite = async (data, requesterId) => {
    const { event_id, guests, subject, content } = data;

    if (!event_id || !guests || !Array.isArray(guests) || guests.length === 0)
        throw { status: 400, message: "event_id và danh sách khách mời là bắt buộc" };

    const event = await Event.getById(event_id);
    if (!event) throw { status: 404, message: "Không tìm thấy sự kiện" };

    const stats = { total: guests.length, success: 0, failed: 0 };
    const results = [];

    for (const g of guests) {
        try {
            // Kiểm tra trùng email cho cùng sự kiện
            const dup = await Attendee.findByEmailAndEvent(g.email, event_id);
            if (dup) {
                results.push({ email: g.email, status: 'skipped', message: 'Email đã tồn tại' });
                continue;
            }

            const qr_code = generateQR(event_id, g.name);
            const id = await Attendee.create({ 
                event_id, 
                user_id: null, 
                name: g.name, 
                email: g.email, 
                qr_code, 
                attendee_type: 'external',
                registered_by: requesterId
            });

            await sendGuestInvitation({
                name: g.name,
                email: g.email,
                qr_code,
                custom_message: content, 
                event: {
                    name: event.name,
                    start_date: event.start_date,
                    end_date: event.end_date,
                    location: event.location,
                    venue_type: event.venue_type,
                    event_type: event.event_type,
                    description: event.description
                }
            });

            stats.success++;
            results.push({ email: g.email, status: 'success', id });
        } catch (err) {
            stats.failed++;
            results.push({ email: g.email, status: 'error', message: err.message });
        }
    }

    return { stats, results };
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

exports.lookup = async (email) => {
    if (!email) throw { status: 400, message: "Email is required" };
    return await Attendee.lookup(email);
};

