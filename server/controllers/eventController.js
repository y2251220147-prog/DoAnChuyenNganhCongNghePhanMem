const eventService = require("../services/eventService");

exports.getAllEvents = async (req, res) => {
    try { res.json(await eventService.getAllEvents()); }
    catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

// GET /api/events/search?search=&status=&event_type=&date_from=&date_to=&page=&limit=
exports.searchEvents = async (req, res) => {
    try {
        const { search, status, event_type, date_from, date_to, page = 1, limit = 10 } = req.query;
        const result = await eventService.searchEvents({
            keyword: search || "",
            status: status || "",
            event_type: event_type || "",
            date_from: date_from || "",
            date_to: date_to || "",
            page,
            limit
        });
        res.json(result);
    }
    catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

exports.getEventById = async (req, res) => {
    try { res.json(await eventService.getEventById(req.params.id)); }
    catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

exports.createEvent = async (req, res) => {
    try {
        const result = await eventService.createEvent(req.body, req.user.id);
        res.status(201).json({ message: "Tạo sự kiện thành công", ...result });
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

exports.updateEvent = async (req, res) => {
    try {
        await eventService.updateEvent(req.params.id, req.body);
        res.json({ message: "Cập nhật sự kiện thành công" });
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

// PATCH /api/events/:id/status  — chuyển trạng thái workflow
exports.changeStatus = async (req, res) => {
    try {
        await eventService.changeStatus(
            req.params.id,
            req.body.status,
            req.user.id,
            req.user.role
        );
        res.json({ message: "Cập nhật trạng thái thành công" });
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

exports.deleteEvent = async (req, res) => {
    try {
        await eventService.deleteEvent(req.params.id);
        res.json({ message: "Xóa sự kiện thành công" });
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

// ── DEADLINES ─────────────────────────────────────────────────
exports.getDeadlines = async (req, res) => {
    try { res.json(await eventService.getDeadlines(req.params.id)); }
    catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

exports.createDeadline = async (req, res) => {
    try {
        const result = await eventService.createDeadline(req.params.id, req.body);
        res.status(201).json({ message: "Thêm deadline thành công", ...result });
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

exports.updateDeadlineStatus = async (req, res) => {
    try {
        await eventService.updateDeadlineStatus(
            req.params.deadlineId, 
            req.body.status, 
            req.body.note,
            req.user.role
        );
        res.json({ message: "Cập nhật deadline thành công" });
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

exports.deleteDeadline = async (req, res) => {
    try {
        await eventService.deleteDeadline(req.params.deadlineId);
        res.json({ message: "Xóa deadline thành công" });
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};
