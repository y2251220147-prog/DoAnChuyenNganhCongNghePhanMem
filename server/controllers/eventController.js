const db = require("../config/database")
const Event = require("../models/eventModel");

exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.getAll();
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const event = await Event.getById(req.params.id);
        if (!event) return res.status(404).json({ message: "Sự kiện không tồn tại" });
        res.json(event);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const id = await Event.create({ ...req.body, organizer_id: req.user?.id });
        res.json({ message: "Đã tạo sự kiện chuyên nghiệp", id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const affectedRows = await Event.update(req.params.id, req.body);
        if (affectedRows === 0) return res.status(404).json({ message: "Không tìm thấy sự kiện" });
        res.json({ message: "Đã cập nhật sự kiện" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const [result] = await db.query("DELETE FROM events WHERE id = ?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Lỗi xoá" });
        res.json({ message: "Đã xoá sự kiện" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.joinEventByCode = async (req, res) => {
    const { event_code } = req.body;
    const user_id = req.user.id;

    try {
        // 1. Find event by code
        const [events] = await db.query("SELECT id FROM events WHERE event_code = ?", [event_code]);
        if (events.length === 0) return res.status(404).json({ message: "Mã sự kiện không hợp lệ" });
        
        const event_id = events[0].id;

        // 2. Add to participants
        await db.query(
            "INSERT INTO event_participants (event_id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE id=id",
            [event_id, user_id]
        );

        res.json({ message: "Tham gia sự kiện thành công!", event_id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getParticipants = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT u.id, u.name, u.email, p.joined_at 
             FROM event_participants p 
             JOIN users u ON p.user_id = u.id 
             WHERE p.event_id = ?`, 
            [req.params.eventId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};