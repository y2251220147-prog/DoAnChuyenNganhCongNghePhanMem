const Department = require("../models/departmentModel");

exports.getAll = async (req, res) => {
    try {
        const deps = await Department.getAll();
        res.json(deps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const dep = await Department.getById(req.params.id);
        if (!dep) return res.status(404).json({ message: "Not found" });
        res.json(dep);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { name, description } = req.body;
        const id = await Department.create(name, description);
        res.status(201).json({ id, name, description });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { name, description } = req.body;
        await Department.update(req.params.id, name, description);
        res.json({ message: "Updated successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.delete = async (req, res) => {
    try {
        await Department.delete(req.params.id);
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await Department.getUsersByDepartment(req.params.id);
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.setUsers = async (req, res) => {
    try {
        const { userIds } = req.body;
        await Department.setUsersDepartment(req.params.id, userIds);
        res.json({ message: "Users updated successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
