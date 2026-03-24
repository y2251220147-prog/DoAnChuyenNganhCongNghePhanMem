const Timeline = require("../models/timelineModel");
const Event = require("../models/eventModel");

exports.getAllTimeline = async () => await Timeline.getAll();

exports.getTimelineByEvent = async (eventId) => await Timeline.getByEvent(eventId);

const formatDateTime = (dt) => {
    if (!dt) return dt;
    if (typeof dt === 'string' && dt.includes('T')) {
        return dt.replace('T', ' ') + (dt.length === 16 ? ':00' : '');
    }
    return dt;
};

// FIX: validate required fields, event existence, end_time > start_time
exports.createTimeline = async (data) => {
    const { event_id, title, start_time, end_time } = data;

    if (!event_id || !title || !start_time)
        throw { status: 400, message: "event_id, title and start_time are required" };

    const event = await Event.getById(event_id);
    if (!event) throw { status: 404, message: "Event not found" };

    if (end_time && new Date(end_time) <= new Date(start_time))
        throw { status: 400, message: "end_time must be after start_time" };

    if (data.start_time) data.start_time = formatDateTime(data.start_time);
    if (data.end_time) data.end_time = formatDateTime(data.end_time);

    const id = await Timeline.create(data);
    return { id };
};

// FIX: validate end_time > start_time khi update
exports.updateTimeline = async (id, data) => {
    const { start_time, end_time } = data;
    if (start_time && end_time && new Date(end_time) <= new Date(start_time))
        throw { status: 400, message: "end_time must be after start_time" };
        
    if (data.start_time) data.start_time = formatDateTime(data.start_time);
    if (data.end_time) data.end_time = formatDateTime(data.end_time);
    
    await Timeline.update(id, data);
};

exports.deleteTimeline = async (id) => await Timeline.delete(id);
