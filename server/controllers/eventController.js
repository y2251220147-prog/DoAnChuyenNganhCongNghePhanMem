const Event = require("../models/eventModel");

exports.getAllEvents = async (req, res) => {

    try {

        const events = await Event.getAll();

        res.json(events);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

exports.createEvent = async (req, res) => {

    const { name, date, location, description } = req.body;

    try {

        const id = await Event.create({
            name,
            date,
            location,
            description
        });

        res.json({
            message: "Event created",
            id
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};