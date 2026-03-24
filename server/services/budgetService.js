const Budget = require("../models/budgetModel");
const Event = require("../models/eventModel");

const getAllBudgets = async () => await Budget.getAll();

const getBudgetsByEvent = async (eventId) => {
    const event = await Event.getById(eventId);
    if (!event) throw { status: 404, message: "Event not found" };
    const items = await Budget.getByEvent(eventId);
    const total = items.reduce((sum, b) => sum + parseFloat(b.cost || 0), 0);
    return { items, total };
};

const createBudget = async ({ event_id, item, cost, note }) => {
    if (!event_id || !item || cost === undefined || cost === null || cost === "")
        throw { status: 400, message: "event_id, item and cost are required" };
    if (isNaN(cost) || parseFloat(cost) < 0)
        throw { status: 400, message: "cost must be a non-negative number" };
    const event = await Event.getById(event_id);
    if (!event) throw { status: 404, message: "Event not found" };
    const id = await Budget.create({ event_id, item, cost: parseFloat(cost), note });
    return { id };
};

// FIX: kiểm tra budget item tồn tại trước khi update
const updateBudget = async (id, { item, cost, note }) => {
    const existing = await Budget.findById(id);
    if (!existing) throw { status: 404, message: "Budget item not found" };
    if (cost !== undefined && (isNaN(cost) || parseFloat(cost) < 0))
        throw { status: 400, message: "cost must be a non-negative number" };
    await Budget.update(id, {
        item: item !== undefined ? item : existing.item,
        cost: cost !== undefined ? parseFloat(cost) : existing.cost,
        note: note !== undefined ? note : existing.note,
    });
};

// FIX: kiểm tra budget item tồn tại trước khi delete
const deleteBudget = async (id) => {
    const existing = await Budget.findById(id);
    if (!existing) throw { status: 404, message: "Budget item not found" };
    await Budget.delete(id);
};

module.exports = { getAllBudgets, getBudgetsByEvent, createBudget, updateBudget, deleteBudget };
