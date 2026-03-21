const Guest = require("../models/guestModel");

exports.getAllGuests = async () => {
    return await Guest.getAll();
};

exports.getGuestsByEvent = async (eventId) => {
    return await Guest.getByEvent(eventId);
};

exports.getGuestById = async (id) => {
    const guest = await Guest.findById(id);
    if (!guest) {
        const err = new Error("Guest not found");
        err.status = 404;
        throw err;
    }
    return guest;
};

exports.createGuest = async (data) => {
    const id = await Guest.create(data);
    return { id };
};

exports.deleteGuest = async (id) => {
    await Guest.delete(id);
};
