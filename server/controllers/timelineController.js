const timelineService = require("../services/timelineService");

exports.getAllTimeline = async (req, res) => {
    try {
        const items = await timelineService.getAllTimeline();
        res.json(items);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.getTimelineByEvent = async (req, res) => {
    try {
        const items = await timelineService.getTimelineByEvent(req.params.eventId);
        res.json(items);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.createTimeline = async (req, res) => {
    try {
        const result = await timelineService.createTimeline(req.body);
        res.status(201).json({ message: "Timeline created", ...result });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.updateTimeline = async (req, res) => {
    try {
        await timelineService.updateTimeline(req.params.id, req.body);
        res.json({ message: "Timeline updated" });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.deleteTimeline = async (req, res) => {
    try {
        await timelineService.deleteTimeline(req.params.id);
        res.json({ message: "Timeline deleted" });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};
