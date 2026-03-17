const db = require("../config/database");

const Budget = {

    getAll: async () => {
        const [rows] = await db.query("SELECT * FROM budgets");
        return rows;
    },

    create: async (data) => {

        const { event_id, item, cost } = data;

        const [result] = await db.query(
            "INSERT INTO budgets (event_id, item, cost) VALUES (?, ?, ?)",
            [event_id, item, cost]
        );

        return result.insertId;
    }

};

module.exports = Budget;