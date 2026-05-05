const Budget = require("../models/budgetModel");
const Event = require("../models/eventModel");
const Notification = require("../models/notificationModel");
const { notifyManagers } = require("./notificationUtils");

const checkBudgetAlert = async (eventId) => {
    try {
        const event = await Event.getById(eventId);
        if (!event || !event.total_budget || event.total_budget <= 0) return;

        const items = await Budget.getByEvent(eventId);
        const totalCost = items.reduce((sum, b) => sum + parseFloat(b.cost || 0), 0);

        if (totalCost > event.total_budget) {
            const message = `Sự kiện "${event.name}" đã chi tiêu ${totalCost.toLocaleString('vi-VN')}đ, vượt mức ngân sách ${event.total_budget.toLocaleString('vi-VN')}đ.`;
            
            // 1. Thông báo cho Organizer
            if (event.owner_id) {
                await Notification.create({
                    user_id: event.owner_id,
                    type: 'budget_alert',
                    title: '⚠️ Cảnh báo vượt ngân sách!',
                    message,
                    link: `/budget?eventId=${eventId}`
                });
            }

            // 2. Thông báo cho cấp quản lý (Admins & Organizers)
            await notifyManagers({
                type: 'budget_alert',
                title: 'Cảnh báo ngân sách sự kiện',
                message,
                link: `/budget?eventId=${eventId}`
            });
        }
    } catch (e) {
        console.error("Lỗi checkBudgetAlert:", e);
    }
};

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
    
    // Kiểm tra vượt ngân sách sau khi thêm
    await checkBudgetAlert(event_id);
    
    return { id };
};

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
    
    // Kiểm tra vượt ngân sách sau khi cập nhật
    await checkBudgetAlert(existing.event_id);
};

const deleteBudget = async (id) => {
    const existing = await Budget.findById(id);
    if (!existing) throw { status: 404, message: "Budget item not found" };
    await Budget.delete(id);
};

module.exports = { getAllBudgets, getBudgetsByEvent, createBudget, updateBudget, deleteBudget };
