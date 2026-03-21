const Staff = require("../models/staffModel");

exports.getAllStaff = async (req, res) => {
    try {
        const staff = await Staff.getAll();
        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getStaffByEvent = async (req, res) => {
    try {
        const staff = await Staff.getByEventId(req.params.eventId);
        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.assignStaff = async (req, res) => {
    try {
        const id = await Staff.assign({ ...req.body, event_id: req.params.eventId });
        res.status(201).json({ message: "Nhân sự đã được phân công", id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.removeStaff = async (req, res) => {
    try {
        const affected = await Staff.remove(req.params.id);
        if (affected === 0) return res.status(404).json({ message: "Không tìm thấy phân công này" });
        res.json({ message: "Đã gỡ bỏ nhân sự" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};