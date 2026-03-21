const Budget = require("../models/budgetModel");

exports.getAllBudgets = async (req, res) => {
    try {
        const budgets = await Budget.getAll();
        res.json(budgets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getBudgetsByEvent = async (req, res) => {
    try {
        const db = require("../config/database");
        const [rows] = await db.query(
            "SELECT * FROM event_budget WHERE event_id = ? ORDER BY id DESC",
            [req.params.eventId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createBudget = async (req, res) => {
    const { event_id, item, cost } = req.body;
    if (!event_id || !item || cost === undefined) {
        return res.status(400).json({ message: "event_id, item and cost are required" });
    }
    try {
        const id = await Budget.create({ event_id, item, cost });
        res.status(201).json({ message: "Budget created", id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateBudget = async (req, res) => {
    const { item, cost } = req.body;
    if (!item || cost === undefined) {
        return res.status(400).json({ message: "item and cost are required" });
    }
    try {
        await Budget.update(req.params.id, { item, cost });
        res.json({ message: "Budget updated successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteBudget = async (req, res) => {
    try {
        const db = require("../config/database");
        await db.query("DELETE FROM event_budget WHERE id = ?", [req.params.id]);
        res.json({ message: "Budget deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
