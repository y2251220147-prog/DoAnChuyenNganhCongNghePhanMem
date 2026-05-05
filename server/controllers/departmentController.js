const departmentService = require("../services/departmentService");

exports.getAllDepartments = async (req, res) => {
    try {
        const depts = await departmentService.getAllDepartments();
        res.json(depts);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.getDepartmentById = async (req, res) => {
    try {
        const dept = await departmentService.getDepartmentById(req.params.id);
        res.json(dept);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.createDepartment = async (req, res) => {
    try {
        const result = await departmentService.createDepartment(req.body);
        res.status(201).json({ message: "Tạo phòng ban thành công", id: result.id });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.updateDepartment = async (req, res) => {
    try {
        await departmentService.updateDepartment(req.params.id, req.body);
        res.json({ message: "Cập nhật phòng ban thành công" });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.deleteDepartment = async (req, res) => {
    try {
        await departmentService.deleteDepartment(req.params.id);
        res.json({ message: "Xóa phòng ban thành công" });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};
