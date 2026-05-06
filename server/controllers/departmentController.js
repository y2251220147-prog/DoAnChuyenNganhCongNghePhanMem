const Department = require("../models/departmentModel");
const User = require("../models/userModel");

const ok = (res, d, s = 200) => res.status(s).json(d);
const err = (res, e) => res.status(e.status || 500).json({ message: e.message });

exports.getAll = async (req, res) => {
    try {
        const data = await Department.getAll();
        ok(res, data);
    } catch (e) {
        err(res, e);
    }
};

exports.getById = async (req, res) => {
    try {
        const data = await Department.getById(req.params.id);
        if (!data) return res.status(404).json({ message: "Không tìm thấy phòng ban" });
        ok(res, data);
    } catch (e) {
        err(res, e);
    }
};

exports.create = async (req, res) => {
    try {
        if (!req.body.name) throw { status: 400, message: "Tên phòng ban là bắt buộc" };
        const id = await Department.create(req.body);
        // Sync manager's department
        if (req.body.manager_id) {
            await User.updateDepartment(req.body.manager_id, id);
        }
        ok(res, { id, ...req.body }, 201);
    } catch (e) {
        err(res, e);
    }
};

exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        await Department.update(id, req.body);
        // Sync manager's department
        if (req.body.manager_id) {
            await User.updateDepartment(req.body.manager_id, id);
        }
        ok(res, { message: "Cập nhật thành công" });
    } catch (e) {
        err(res, e);
    }
};

exports.delete = async (req, res) => {
    try {
        await Department.delete(req.params.id);
        ok(res, { message: "Xóa thành công" });
    } catch (e) {
        err(res, e);
    }
};
