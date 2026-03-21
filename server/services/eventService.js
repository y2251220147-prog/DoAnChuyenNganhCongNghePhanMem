// const Event = require("../models/eventModel");

// const VALID_STATUSES = ["planned", "active", "completed", "cancelled"];

// /**
//  * Lấy tất cả sự kiện
//  */
// const getAllEvents = async () => {
//     return await Event.getAll();
// };

// /**
//  * Lấy chi tiết 1 sự kiện theo ID
//  */
// const getEventById = async (id) => {
//     const event = await Event.getById(id);
//     if (!event) {
//         throw { status: 404, message: "Event not found" };
//     }
//     return event;
// };

// /**
//  * Tạo sự kiện mới
//  */
// const createEvent = async ({ name, date, location, description, status }) => {
//     if (!name || !date) {
//         throw { status: 400, message: "Name and date are required" };
//     }
//     if (status && !VALID_STATUSES.includes(status)) {
//         throw { status: 400, message: `Status must be one of: ${VALID_STATUSES.join(", ")}` };
//     }

//     const id = await Event.create({ name, date, location, description, status: status || "planned" });
//     return { id };
// };

// /**
//  * Cập nhật thông tin sự kiện
//  */
// const updateEvent = async (id, { name, date, location, description, status }) => {
//     const event = await Event.getById(id);
//     if (!event) {
//         throw { status: 404, message: "Event not found" };
//     }
//     if (status && !VALID_STATUSES.includes(status)) {
//         throw { status: 400, message: `Status must be one of: ${VALID_STATUSES.join(", ")}` };
//     }

//     await Event.update(id, {
//         name: name ?? event.name,
//         date: date ?? event.date,
//         location: location ?? event.location,
//         description: description ?? event.description,
//         status: status ?? event.status,
//     });
// };

// /**
//  * Xóa sự kiện
//  */
// const deleteEvent = async (id) => {
//     const event = await Event.getById(id);
//     if (!event) {
//         throw { status: 404, message: "Event not found" };
//     }
//     await Event.delete(id);
// };

// module.exports = { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent };
