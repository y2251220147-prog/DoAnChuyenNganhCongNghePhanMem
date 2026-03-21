const guestService = require("../services/guestService");

exports.getAllGuests = async (req, res) => {
    try {
        const guests = await guestService.getAllGuests();
        res.json(guests);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.getGuestsByEvent = async (req, res) => {
    try {
        const guests = await guestService.getGuestsByEvent(req.params.eventId);
        res.json(guests);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.getGuestById = async (req, res) => {
    try {
        const guest = await guestService.getGuestById(req.params.id);
        res.json(guest);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.createGuest = async (req, res) => {
    try {
        const result = await guestService.createGuest(req.body);
        res.status(201).json({ message: "Guest created", ...result });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.deleteGuest = async (req, res) => {
    try {
        await guestService.deleteGuest(req.params.id);
        res.json({ message: "Guest deleted" });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};
