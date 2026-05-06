const budgetService = require("../services/budgetService");

exports.getAllBudgets = async (req, res) => {
    try {
        const data = await budgetService.getAllBudgets();
        res.json(data);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.getBudgetsByEvent = async (req, res) => {
    try {
        const data = await budgetService.getBudgetsByEvent(req.params.eventId);
        // data = { event, items, stats }
        res.json(data);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.createBudget = async (req, res) => {
    try {
        const result = await budgetService.createBudget(req.body);
        res.status(201).json({ message: "Tạo khoản chi thành công", ...result });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.updateBudget = async (req, res) => {
    try {
        await budgetService.updateBudget(req.params.id, req.body);
        res.json({ message: "Cập nhật khoản chi thành công" });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

exports.deleteBudget = async (req, res) => {
    try {
        await budgetService.deleteBudget(req.params.id);
        res.json({ message: "Xóa khoản chi thành công" });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};
