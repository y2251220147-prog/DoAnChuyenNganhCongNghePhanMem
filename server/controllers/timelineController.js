const Timeline = require("../models/timelineModel");

exports.getAllTimeline = async (req, res) => {
    try {
        const timeline = await Timeline.getAll();
        res.json(timeline);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getTimelineByEvent = async (req, res) => {
    try {
        const timeline = await Timeline.getByEventId(req.params.eventId);
        res.json(timeline);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addTimeline = async (req, res) => {
    try {
        const id = await Timeline.create({ ...req.body, event_id: req.params.eventId });
        res.status(201).json({ message: "Timeline item added", id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateTimeline = async (req, res) => {
    try {
        const affected = await Timeline.update(req.params.id, req.body);
        if (affected === 0) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Updated" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteTimeline = async (req, res) => {
    try {
        const affected = await Timeline.delete(req.params.id);
        if (affected === 0) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};