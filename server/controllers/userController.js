const User = require("../models/userModel");

exports.getUsers = async (req, res) => {

    try {

        const users = await User.getAllUsers();

        res.json(users);

    } catch (err) {

        res.status(500).json({ message: err.message });

    }

};

exports.changeRole = async (req, res) => {

    const { id } = req.params;
    const { role } = req.body;

    try {

        await User.updateRole(id, role);

        res.json({ message: "Role updated" });

    } catch (err) {

        res.status(500).json({ message: err.message });

    }

};