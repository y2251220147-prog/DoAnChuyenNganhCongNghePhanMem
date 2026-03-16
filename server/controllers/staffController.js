const Staff = require("../models/staffModel");

exports.getAllStaff = async (req, res) => {

    try {

        const staff = await Staff.getAll();

        res.json(staff);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

exports.assignStaff = async (req, res) => {

    const { event_id, user_id, role } = req.body;

    try {

        const id = await Staff.assign({
            event_id,
            user_id,
            role
        });

        res.json({
            message: "Staff assigned",
            id
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};