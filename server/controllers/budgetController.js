const Budget = require("../models/budgetModel");

exports.getAllBudgets = async (req, res) => {

    try {

        const budgets = await Budget.getAll();

        res.json(budgets);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

exports.createBudget = async (req, res) => {

    const { event_id, item, cost } = req.body;

    try {

        const id = await Budget.create({
            event_id,
            item,
            cost
        });

        res.json({
            message: "Budget created",
            id
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};