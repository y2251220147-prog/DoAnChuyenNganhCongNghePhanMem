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
        
        // Notify Managers & Event Owner
        const { notifyManagers } = require("../services/notificationUtils");
        const Event = require("../models/eventModel");
        const Notification = require("../models/notificationModel");
        
        // 1. Thông báo cho cấp quản lý
        await notifyManagers({
            type: 'default',
            title: 'Phản hồi sự kiện mới',
            message: `Có phản hồi mới cho sự kiện #${req.body.event_id}`,
            link: '/feedback'
        });

        // 2. Thông báo cho Người sở hữu sự kiện (Organizer)
        try {
            const event = await Event.getById(req.body.event_id);
            if (event && event.owner_id) {
                await Notification.create({
                    user_id: event.owner_id,
                    type: 'default',
                    title: 'Phản hồi mới từ khách tham dự 💬',
                    message: `Sự kiện "${event.name}" vừa nhận được đánh giá mới.`,
                    link: `/feedback`
                });
            }
        } catch (e) { console.error("Lỗi thông báo Organizer (feedback):", e); }

        res.status(201).json({ message: "Feedback submitted", id });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteFeedback = async (req, res) => {
    try {
        await Feedback.delete(req.params.id);
        res.json({ message: "Feedback deleted" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};
