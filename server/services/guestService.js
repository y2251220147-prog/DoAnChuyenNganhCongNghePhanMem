const Guest = require("../models/guestModel");
const Event = require("../models/eventModel");
const { generateQR } = require("./qrService");

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

exports.getAllGuests = async () => await Guest.getAll();

exports.getGuestsByEvent = async (eventId) => await Guest.getByEvent(eventId);

exports.getGuestById = async (id) => {
    const guest = await Guest.findById(id);
    if (!guest) throw { status: 404, message: "Guest not found" };
    return guest;
};

// FIX 8+11: validate input + server generates QR code
exports.createGuest = async (data) => {
    const { event_id, name, email } = data;

    if (!event_id || !name || !email)
        throw { status: 400, message: "event_id, name and email are required" };
    if (!isValidEmail(email))
        throw { status: 400, message: "Invalid email format" };

    const event = await Event.getById(event_id);
    if (!event) throw { status: 404, message: "Event not found" };

    // Server tạo QR có chữ ký, bỏ qua qr_code từ client
    const qr_code = generateQR(event_id, name);

    const id = await Guest.create({ ...data, qr_code });
    return { id, qr_code };
};

exports.deleteGuest = async (id) => {
    const guest = await Guest.findById(id);
    if (!guest) throw { status: 404, message: "Guest not found" };
    await Guest.delete(id);
};
