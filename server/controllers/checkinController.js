const checkinService = require("../services/checkinService");

exports.checkin = async (req, res) => {
    try {
        const { qr_code, event_id } = req.body;
        const result = await checkinService.checkin(qr_code, event_id);
        res.json({
            message: `✅ Check-in thành công! Chào mừng ${result.person.name} đến sự kiện "${result.person.event_name}"`,
            ...result
        });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const stats = await checkinService.getCheckinStats(req.params.eventId);
        res.json(stats);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.getCheckinList = async (req, res) => {
    try {
        const list = await checkinService.getCheckinList(req.params.eventId);
        res.json(list);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};
