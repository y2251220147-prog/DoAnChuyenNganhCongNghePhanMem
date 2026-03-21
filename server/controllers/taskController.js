const Task = require("../models/taskModel");

exports.getTasksByEvent = async (req, res) => {
    try {
        const tasks = await Task.getByEvent(req.params.eventId);
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createTask = async (req, res) => {
    try {
        const id = await Task.create(req.body);
        res.json({ message: "Đã tạo nhiệm vụ triển khai", id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        await Task.update(req.params.id, req.body);
        res.json({ message: "Cập nhật thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        await Task.delete(req.params.id);
        res.json({ message: "Đã xoá nhiệm vụ" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
