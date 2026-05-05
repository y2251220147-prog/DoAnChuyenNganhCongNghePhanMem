const staffService = require("../services/staffService");

exports.getAllStaff = async (req, res) => {
    try {
        const staff = await staffService.getAllStaff();
        res.json(staff);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.getStaffByEvent = async (req, res) => {
    try {
        const staff = await staffService.getStaffByEvent(req.params.eventId);
        res.json(staff);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.assignStaff = async (req, res) => {
    try {
        const result = await staffService.assignStaff(req.body);
        res.status(201).json({ message: "Staff assigned", ...result });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.removeStaff = async (req, res) => {
    try {
        await staffService.removeStaff(req.params.id);
        res.json({ message: "Đã xóa nhân sự khỏi sự kiện" });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.assignByDepartment = async (req, res) => {
    try {
        const result = await staffService.assignByDepartment(req.body);
        res.status(201).json(result);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};
