const Feedback = require("../models/feedbackModel");

exports.getAllFeedback = async (req, res) => {
    try { res.json(await Feedback.getAll()); }
    catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getFeedbackByEvent = async (req, res) => {
    try { res.json(await Feedback.getByEvent(req.params.eventId)); }
    catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createFeedback = async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });
    try {
        const id = await Feedback.create(req.body);
        res.status(201).json({ message: "Feedback submitted", id });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteFeedback = async (req, res) => {
    try {
        await Feedback.delete(req.params.id);
        res.json({ message: "Feedback deleted" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};
