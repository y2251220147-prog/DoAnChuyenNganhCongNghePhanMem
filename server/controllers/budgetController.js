const Budget = require("../models/budgetModel");

exports.getAllBudgets = async (req, res) => {
    try {
        const budgets = await Budget.getAll();
        res.json(budgets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getBudgetByEvent = async (req, res) => {
    try {
        const budget = await Budget.getByEventId(req.params.eventId);
        res.json(budget);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addBudget = async (req, res) => {
    try {
        const id = await Budget.create({ ...req.body, event_id: req.params.eventId });
        res.status(201).json({ message: "Chi phí đã được thêm", id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateBudget = async (req, res) => {
    try {
        const affected = await Budget.update(req.params.id, req.body);
        if (affected === 0) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Updated" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteBudget = async (req, res) => {
    try {
        const affected = await Budget.delete(req.params.id);
        if (affected === 0) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};