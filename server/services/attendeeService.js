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
    const { event_id, name, email, phone, organization, note } = data;
    if (!event_id || !name || !email) throw { status: 400, message: "event_id, name và email là bắt buộc" };
    if (!isEmail(email)) throw { status: 400, message: "Email không hợp lệ" };
    const event = await Event.getById(event_id);
    if (!event) throw { status: 404, message: "Không tìm thấy sự kiện" };
    
    const dup = await Attendee.findByEmailAndEvent(email, event_id);
    if (dup) throw { status: 409, message: "Email này đã đăng ký sự kiện rồi" };

    // Đồng bộ với bảng users
    const existingUser = await User.findByEmail(email);
    const user_id = existingUser ? existingUser.id : null;
    const attendee_type = existingUser ? 'internal' : 'external';

    const qr_code = generateQR(event_id, name);
    const id = await Attendee.create({
        event_id, user_id, name, email, phone,
        attendee_type, qr_code, registered_by: registeredBy,
        organization: organization || null
    });

    // Gửi email mời
    try {
        await sendGuestInvitation({
            name, email, qr_code,
            custom_message: note,
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
    } catch (err) {
        console.error("Lỗi gửi mail mời (đơn):", err.message);
    }

    // Thông báo cho Người sở hữu sự kiện (Organizer)
    if (event.owner_id) {
        try {
            await Notification.create({
                user_id: event.owner_id,
                type: 'registration',
                title: 'Có người mới đăng ký 🎟️',
                message: `"${name}" vừa được thêm vào danh sách khách mời của sự kiện "${event.name}".`,
                link: `/events/${event_id}?tab=attendees`
            });
        } catch (e) { console.error("Lỗi thông báo Organizer (external):", e); }
    }

    return { id, qr_code };
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

    // Gửi mail mời cho chính mình (nếu muốn) - Ở đây có thể bỏ qua vì staff tự đăng ký
    // Nhưng nếu muốn chuyên nghiệp thì vẫn nên gửi
    try {
        await sendGuestInvitation({
            name: user.name, email: user.email, qr_code,
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
    } catch (err) { console.error("Lỗi gửi mail self-reg:", err.message); }

    // Thông báo cho Người sở hữu sự kiện (Organizer)
    if (event.owner_id && String(event.owner_id) !== String(userId)) {
        try {
            await Notification.create({
                user_id: event.owner_id,
                type: 'registration',
                title: 'Nhân viên đăng ký mới 🎟️',
                message: `"${user.name}" vừa đăng ký tham gia sự kiện "${event.name}".`,
                link: `/events/${eventId}?tab=attendees`
            });
        } catch (e) { console.error("Lỗi thông báo Organizer (internal):", e); }
    }

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

exports.bulkAddExternal = async (data, registeredBy) => {
    const { event_id, guests, note } = data;
    if (!event_id || !Array.isArray(guests)) throw { status: 400, message: "Thiếu event_id hoặc danh sách khách mời" };
    
    const event = await Event.getById(event_id);
    if (!event) throw { status: 404, message: "Không tìm thấy sự kiện" };

    const results = [];
    for (const g of guests) {
        try {
            if (!g.name || !g.email || !isEmail(g.email)) continue;
            
            // Check trùng
            const dup = await Attendee.findByEmailAndEvent(g.email, event_id);
            if (dup) continue;

            // Đồng bộ với bảng users
            const existingUser = await User.findByEmail(g.email);
            const user_id = existingUser ? existingUser.id : null;
            const attendee_type = existingUser ? 'internal' : 'external';

            const qr_code = generateQR(event_id, g.name);
            await Attendee.create({
                event_id, user_id, name: g.name, email: g.email,
                attendee_type, qr_code, registered_by: registeredBy,
                organization: data.organization || null
            });

            // Gửi email mời hàng loạt
            try {
                await sendGuestInvitation({
                    name: g.name, email: g.email, qr_code,
                    custom_message: note,
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
            } catch (mailErr) {
                console.error(`Lỗi gửi mail bulk cho ${g.email}:`, mailErr.message);
            }

            results.push({ name: g.name, email: g.email, status: 'success' });
        } catch (e) {
            console.error("Lỗi add guest hàng loạt:", e);
        }
    }
    // Thông báo cho Người sở hữu sự kiện (Organizer)
    if (event.owner_id && results.length > 0) {
        try {
            await Notification.create({
                user_id: event.owner_id,
                type: 'registration',
                title: 'Danh sách khách mời mới 🎟️',
                message: `Đã thêm thành công ${results.length} khách mời vào sự kiện "${event.name}".`,
                link: `/events/${event_id}?tab=attendees`
            });
        } catch (e) { console.error("Lỗi thông báo Organizer (bulk):", e); }
    }

    return { count: results.length, total: guests.length };
};

exports.lookup = async (email) => {
    if (!email) throw { status: 400, message: "Email là bắt buộc" };
    const attendees = await Attendee.findByEmail(email);
    const results = [];
    for (const att of attendees) {
        const event = await Event.getById(att.event_id);
        results.push({ guest: att, event });
    }
    return results;
};
