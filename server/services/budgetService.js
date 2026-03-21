// const Budget = require("../models/budgetModel");
// const Event = require("../models/eventModel");

// /**
//  * Lấy tất cả budget items
//  */
// const getAllBudgets = async () => {
//     return await Budget.getAll();
// };

// /**
//  * Lấy budget items theo sự kiện, kèm tổng chi phí
//  */
// const getBudgetsByEvent = async (eventId) => {
//     const event = await Event.getById(eventId);
//     if (!event) {
//         throw { status: 404, message: "Event not found" };
//     }

//     const items = await Budget.getByEvent(eventId);
//     const total = items.reduce((sum, b) => sum + parseFloat(b.cost || 0), 0);

//     return { items, total };
// };

// /**
//  * Thêm budget item
//  */
// const createBudget = async ({ event_id, item, cost, note }) => {
//     if (!event_id || !item || cost === undefined || cost === null || cost === "") {
//         throw { status: 400, message: "event_id, item and cost are required" };
//     }
//     if (isNaN(cost) || parseFloat(cost) < 0) {
//         throw { status: 400, message: "cost must be a non-negative number" };
//     }

//     const event = await Event.getById(event_id);
//     if (!event) {
//         throw { status: 404, message: "Event not found" };
//     }

//     const id = await Budget.create({ event_id, item, cost: parseFloat(cost), note });
//     return { id };
// };

// /**
//  * Cập nhật budget item
//  */
// const updateBudget = async (id, { item, cost, note }) => {
//     if (cost !== undefined && (isNaN(cost) || parseFloat(cost) < 0)) {
//         throw { status: 400, message: "cost must be a non-negative number" };
//     }
//     await Budget.update(id, { item, cost: cost !== undefined ? parseFloat(cost) : undefined, note });
// };

// /**
//  * Xóa budget item
//  */
// const deleteBudget = async (id) => {
//     await Budget.delete(id);
// };

// module.exports = { getAllBudgets, getBudgetsByEvent, createBudget, updateBudget, deleteBudget };
