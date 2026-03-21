const Communication = require("../models/communicationModel");

exports.getAllComm = async (req, res) => {
    try {
        const row = await Communication.getAll();
        res.json(row);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getCommByEvent = async (req, res) => {
    try {
        const row = await Communication.getByEventId(req.params.eventId);
        res.json(row);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addComm = async (req, res) => {
    try {
        const id = await Communication.create({ ...req.body, event_id: req.params.eventId });
        res.status(201).json({ id, message: "Thêm hoạt động truyền thông thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateComm = async (req, res) => {
    try {
        await Communication.update(req.params.id, req.body);
        res.json({ message: "Cập nhật thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteComm = async (req, res) => {
    try {
        await Communication.delete(req.params.id);
        res.json({ message: "Xoá thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
