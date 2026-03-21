const Guest = require("../models/guestModel");

exports.getAllGuests = async (req, res) => {
    try {
        const guests = await Guest.getAll();
        res.json(guests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getGuestsByEvent = async (req, res) => {
    try {
        const guests = await Guest.getByEventId(req.params.eventId);
        res.json(guests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addGuest = async (req, res) => {
    try {
        const id = await Guest.create({ ...req.body, event_id: req.params.eventId });
        res.status(201).json({ message: "Khách mời đã được thêm", id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateGuest = async (req, res) => {
    try {
        const affected = await Guest.update(req.params.id, req.body);
        if (affected === 0) return res.status(404).json({ message: "Không tìm thấy khách mời" });
        res.json({ message: "Đã cập nhật khách mời" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteGuest = async (req, res) => {
    try {
        const affected = await Guest.delete(req.params.id);
        if (affected === 0) return res.status(404).json({ message: "Không tìm thấy khách mời" });
        res.json({ message: "Đã xoá khách mời" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.toggleCheckin = async (req, res) => {
    try {
        const { checked_in } = req.body;
        await Guest.toggleCheckin(req.params.id, checked_in);
        res.json({ message: "Cập nhật check-in thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};