const Guest = require("../models/guestModel");

exports.getAllGuests = async (req, res) => {

    try {

        const guests = await Guest.getAll();
        res.json(guests);

    } catch (err) {

        res.status(500).json({ message: err.message });

    }

};

exports.createGuest = async (req, res) => {

    const { event_id, name, email } = req.body;

    try {

        const id = await Guest.create({
            event_id,
            name,
            email
        });

        res.json({
            message: "Guest created",
            id
        });

    } catch (err) {

        res.status(500).json({ message: err.message });

    }

};