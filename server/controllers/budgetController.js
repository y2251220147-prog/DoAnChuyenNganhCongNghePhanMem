const budgetService = require("../services/budgetService");

exports.getAllBudgets = async (req, res) => {
    try { res.json(await budgetService.getAllBudgets()); }
    catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

exports.getBudgetsByEvent = async (req, res) => {
    try { res.json(await budgetService.getBudgetsByEvent(req.params.eventId)); }
    catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

exports.createBudget = async (req, res) => {
    try {
        const result = await budgetService.createBudget(req.body);
        res.status(201).json({ message: "Budget created", ...result });
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

exports.updateBudget = async (req, res) => {
    try {
        await budgetService.updateBudget(req.params.id, req.body);
        res.json({ message: "Budget updated" });
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};

exports.deleteBudget = async (req, res) => {
    try {
        await budgetService.deleteBudget(req.params.id);
        res.json({ message: "Budget deleted" });
    } catch (err) { res.status(err.status || 500).json({ message: err.message }); }
};
