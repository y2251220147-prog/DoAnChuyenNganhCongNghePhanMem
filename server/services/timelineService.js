const Timeline = require("../models/timelineModel");

exports.getAllTimeline = async () => {
    return await Timeline.getAll();
};

exports.getTimelineByEvent = async (eventId) => {
    return await Timeline.getByEvent(eventId);
};

exports.createTimeline = async (data) => {
    const id = await Timeline.create(data);
    return { id };
};

exports.updateTimeline = async (id, data) => {
    await Timeline.update(id, data);
};

exports.deleteTimeline = async (id) => {
    await Timeline.delete(id);
};
