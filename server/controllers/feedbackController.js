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
        
        // Notify Admins
        const { notifyAdmins } = require("../services/notificationUtils");
        // Ta có thể fetch event từ eventService để lấy tên, tạm thời ta có event_id
        await notifyAdmins({
            type: 'default',
            title: 'Phản hồi sự kiện mới',
            message: `Có phản hồi mới từ tài khoản #${req.body.user_id} cho sự kiện #${req.body.event_id}`,
            link: '/feedback'
        });

        res.status(201).json({ message: "Feedback submitted", id });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteFeedback = async (req, res) => {
    try {
        await Feedback.delete(req.params.id);
        res.json({ message: "Feedback deleted" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};
