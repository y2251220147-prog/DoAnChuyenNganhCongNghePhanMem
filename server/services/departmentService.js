const Department = require("../models/departmentModel");

const getAllDepartments = async () => {
    return await Department.getAll();
};

const getDepartmentById = async (id) => {
    const dept = await Department.getById(id);
    if (!dept) throw { status: 404, message: "Phòng ban không tồn tại" };
    return dept;
};

const createDepartment = async (data) => {
    if (!data.name || !data.code) {
        throw { status: 400, message: "Tên và mã phòng ban là bắt buộc" };
    }
    const id = await Department.create(data);
    return { id };
};

const updateDepartment = async (id, data) => {
    await getDepartmentById(id);
    if (!data.name || !data.code) {
        throw { status: 400, message: "Tên và mã phòng ban là bắt buộc" };
    }
    await Department.update(id, data);
};

const deleteDepartment = async (id) => {
    await getDepartmentById(id);
    try {
        await Department.delete(id);
    } catch (err) {
        if (err.code === "ER_ROW_IS_REFERENCED_2") {
            throw { status: 400, message: "Không thể xóa phòng ban đang có nhân viên hoặc task phụ trách" };
        }
        throw err;
    }
};

module.exports = {
    getAllDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment
};
