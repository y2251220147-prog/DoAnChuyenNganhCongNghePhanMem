const Guest = require("../models/guestModel");
const Attendee = require("../models/attendeeModel");
const Event = require("../models/eventModel");
const { generateQR } = require("./qrService");
const { sendGuestInvitation } = require("./emailService");

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

exports.getAllGuests = async () => await Guest.getAll();

exports.getGuestsByEvent = async (eventId) => await Guest.getByEvent(eventId);

exports.getGuestById = async (id) => {
    const guest = await Guest.findById(id);
    if (!guest) throw { status: 404, message: "Guest not found" };
    return guest;
};

exports.createGuest = async (data) => {
    const { event_id, name, email } = data;

    if (!event_id || !name || !email)
        throw { status: 400, message: "event_id, name and email are required" };
    if (!isValidEmail(email))
        throw { status: 400, message: "Invalid email format" };

    const event = await Event.getById(event_id);
    if (!event) throw { status: 404, message: "Event not found" };

    // Không thêm khách vào sự kiện đã kết thúc hoặc đã huỷ
    if (['completed', 'cancelled'].includes(event.status))
        throw { status: 400, message: `Không thể thêm khách mời vào sự kiện đã kết thúc hoặc đã huỷ` };

    // Kiểm tra trùng email cho cùng sự kiện
    const dupGuest = await Guest.findByEmailAndEvent(email, event_id);
    const dupAtt = await Attendee.findByEmailAndEvent(email, event_id);
    if (dupGuest || dupAtt) throw { status: 409, message: "Email này đã được đăng ký cho sự kiện này rồi" };

    // Server tạo QR có chữ ký, bỏ qua qr_code từ client
    const qr_code = generateQR(event_id, name);

    const id = await Guest.create({ ...data, qr_code });

    // Gửi email mời tự động sau khi tạo khách thành công
    let emailSent = false;
    console.log(`📧 Đang gửi email mời cho: ${email} (sự kiện: ${event.name})`);
    try {
        await sendGuestInvitation({
            name,
            email,
            qr_code,
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
        console.log(`✅ Email mời đã gửi thành công đến: ${email}`);
    } catch (emailErr) {
        // Không throw - gửi email thất bại không ảnh hưởng đến việc tạo guest
        console.error(`❌ Lỗi gửi email mời đến ${email}:`, emailErr.message);
    }

    return { id, qr_code, emailSent };
};

exports.deleteGuest = async (id) => {
    const guest = await Guest.findById(id);
    if (!guest) throw { status: 404, message: "Guest not found" };
    await Guest.delete(id);
};

// Tra cứu vé khách mời theo email (public endpoint)
exports.lookupByEmail = async (email) => {
    if (!email || !isValidEmail(email))
        throw { status: 400, message: "Email không hợp lệ" };
    const rows = await Guest.findByEmail(email);
    if (!rows.length) throw { status: 404, message: "Không tìm thấy khách mời với email này" };
    // Chuyển đổi thành { guest, event } cho mỗi record
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
