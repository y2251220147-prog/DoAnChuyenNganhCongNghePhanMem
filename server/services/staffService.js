const Staff = require("../models/staffModel");

exports.getAllStaff = async () => {
    return await Staff.getAll();
};

exports.getStaffByEvent = async (eventId) => {
    return await Staff.getByEvent(eventId);
};

exports.assignStaff = async (data) => {
    const id = await Staff.assign(data);
    return { id };
};

exports.removeStaff = async (id) => {
    await Staff.remove(id);
};
