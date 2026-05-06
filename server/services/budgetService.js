const Budget = require("../models/budgetModel");
const Event = require("../models/eventModel");
const Task = require("../models/taskModel");
const Notification = require("../models/notificationModel");
const { notifyManagers } = require("./notificationUtils");

// =============================================================
// KIỂM TRA VÀ GỬI CẢNH BÁO NGÂN SÁCH
// Logic: Thực chi = các khoản budget có status='paid'
//        Khi tổng thực chi > 90% ngân sách sự kiện → cảnh báo
//        Khi tổng thực chi > 100%                  → cảnh báo vượt ngân sách
// =============================================================
const checkBudgetAlert = async (eventId) => {
    try {
        const event = await Event.getById(eventId);
        if (!event || !event.total_budget || Number(event.total_budget) <= 0) return;

        const summary = await Budget.getSummaryByEvent(eventId);
        const totalPaid = Number(summary.total_paid || 0);
        const totalBudget = Number(event.total_budget);
        const ratio = totalPaid / totalBudget;

        let alertTitle = null;
        let alertMsg = null;

        if (ratio > 1) {
            alertTitle = "⚠️ Vượt ngân sách!";
            alertMsg = `Sự kiện "${event.name}" đã chi thực tế ${totalPaid.toLocaleString("vi-VN")}₫, vượt quá ngân sách phê duyệt ${totalBudget.toLocaleString("vi-VN")}₫ (${Math.round(ratio * 100)}%).`;
        } else if (ratio >= 0.9) {
            alertTitle = "🔔 Gần đạt giới hạn ngân sách";
            alertMsg = `Sự kiện "${event.name}" đã chi ${Math.round(ratio * 100)}% ngân sách (${totalPaid.toLocaleString("vi-VN")}₫ / ${totalBudget.toLocaleString("vi-VN")}₫). Vui lòng kiểm soát chi tiêu.`;
        }

        if (alertTitle) {
            const link = `/budget?eventId=${eventId}`;
            if (event.owner_id) {
                await Notification.create({
                    user_id: event.owner_id,
                    type: "budget_alert",
                    title: alertTitle,
                    message: alertMsg,
                    link
                });
            }
            await notifyManagers({ type: "budget_alert", title: alertTitle, message: alertMsg, link });
        }
    } catch (e) {
        console.error("Lỗi checkBudgetAlert:", e);
    }
};

// =============================================================
// GET ALL — Tổng quan toàn hệ thống (admin)
// Trả về tất cả khoản chi kèm event_name
// =============================================================
const getAllBudgets = async () => {
    return await Budget.getAll();
};

// =============================================================
// GET BY EVENT — Chi tiết ngân sách 1 sự kiện
// Trả về:
//   items  : danh sách khoản chi (manual) + khoản dự trù từ task
//   stats  : planned, total_estimated, total_paid, total_pending, task_estimated
// =============================================================
const getBudgetsByEvent = async (eventId) => {
    const event = await Event.getById(eventId);
    if (!event) throw { status: 404, message: "Sự kiện không tồn tại" };

    const items = await Budget.getByEvent(eventId);
    const summary = await Budget.getSummaryByEvent(eventId);

    const planned = Number(event.total_budget || 0);
    const total_estimated = Number(summary.total_estimated || 0);
    const total_paid = Number(summary.total_paid || 0);
    const total_pending = Number(summary.total_pending || 0);
    const remaining = planned - total_paid;

    const stats = {
        planned,
        total_estimated,
        total_paid,
        total_pending,
        remaining,
        over_budget: total_paid > planned,
        usage_ratio: planned > 0 ? Math.round((total_paid / planned) * 100) : 0
    };

    return {
        event: { id: event.id, name: event.name, total_budget: planned },
        items,
        stats
    };
};

// =============================================================
// CREATE — Tạo khoản chi mới
// =============================================================
const createBudget = async (data) => {
    const { event_id, item, cost, note, status, category, task_id } = data;

    if (!event_id) throw { status: 400, message: "Vui lòng chọn sự kiện" };
    if (!item || item.trim() === "") throw { status: 400, message: "Tên khoản chi không được để trống" };
    if (cost === undefined || cost === null || cost === "" || isNaN(Number(cost)))
        throw { status: 400, message: "Số tiền không hợp lệ" };
    if (Number(cost) < 0) throw { status: 400, message: "Số tiền không được âm" };

    const event = await Event.getById(event_id);
    if (!event) throw { status: 404, message: "Sự kiện không tồn tại" };

    if (task_id) {
        const existingTaskBudget = await Budget.findByTaskId(task_id);
        if (existingTaskBudget) {
            throw { status: 400, message: "Công việc này đã được giải ngân / liên kết với một khoản chi khác. Vui lòng kiểm tra lại để tránh chi trùng lặp!" };
        }
    }

    const id = await Budget.create({
        event_id,
        item: item.trim(),
        cost: Number(cost),
        note: note?.trim() || null,
        status: status || "pending",
        category: category || "other",
        task_id: task_id || null
    });

    // Đồng bộ sang task nếu có liên kết
    if (task_id) {
        const finalStatus = status || "pending";
        await Task.updateActualBudget(task_id, finalStatus === "paid" ? cost : 0);
    }

    await checkBudgetAlert(event_id);
    return { id };
};

// =============================================================
// UPDATE — Cập nhật khoản chi
// =============================================================
const updateBudget = async (id, data) => {
    const existing = await Budget.findById(id);
    if (!existing) throw { status: 404, message: "Khoản chi không tồn tại" };

    if (data.cost !== undefined && (isNaN(Number(data.cost)) || Number(data.cost) < 0))
        throw { status: 400, message: "Số tiền không hợp lệ" };

    if (data.task_id !== undefined && data.task_id !== null && data.task_id !== "" && String(data.task_id) !== String(existing.task_id)) {
        const existingTaskBudget = await Budget.findByTaskId(data.task_id);
        if (existingTaskBudget) {
            throw { status: 400, message: "Công việc này đã được giải ngân / liên kết với một khoản chi khác. Vui lòng kiểm tra lại để tránh chi trùng lặp!" };
        }
    }

    const updateData = {
        item: data.item !== undefined ? data.item.trim() : existing.item,
        cost: data.cost !== undefined ? Number(data.cost) : Number(existing.cost),
        note: data.note !== undefined ? data.note : existing.note,
        status: data.status !== undefined ? data.status : existing.status,
        category: data.category !== undefined ? data.category : existing.category,
        task_id: data.task_id !== undefined ? data.task_id : existing.task_id
    };

    await Budget.update(id, updateData);

    // Đồng bộ sang task nếu có liên kết
    if (updateData.task_id) {
        await Task.updateActualBudget(updateData.task_id, updateData.status === "paid" ? updateData.cost : 0);
    }
    // Nếu trước đó có liên kết task khác mà giờ bỏ đi, reset task cũ
    if (existing.task_id && String(existing.task_id) !== String(updateData.task_id)) {
        await Task.updateActualBudget(existing.task_id, 0);
    }

    await checkBudgetAlert(existing.event_id);
};

// =============================================================
// DELETE — Xóa khoản chi
// =============================================================
const deleteBudget = async (id) => {
    const existing = await Budget.findById(id);
    if (!existing) throw { status: 404, message: "Khoản chi không tồn tại" };
    await Budget.delete(id);

    // Reset thực tế đã chi của task nếu có liên kết
    if (existing.task_id) {
        await Task.updateActualBudget(existing.task_id, 0);
    }
};

module.exports = { getAllBudgets, getBudgetsByEvent, createBudget, updateBudget, deleteBudget };
