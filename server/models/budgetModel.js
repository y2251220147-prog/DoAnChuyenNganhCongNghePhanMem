const db = require("../config/database");

const Budget = {

    getAll: async () => {
        const [rows] = await db.query("SELECT * FROM event_budget");
        return rows;
    },

    create: async (data) => {

        const { event_id, item, cost } = data;

        const [result] = await db.query(
            "INSERT INTO event_budget (event_id, item, cost) VALUES (?, ?, ?)",
            [event_id, item, cost]
        );

        return result.insertId;
    },

    update: async (id, data) => {
        const { item, cost } = data;
        await db.query(
            "UPDATE event_budget SET item = ?, cost = ? WHERE id = ?",
            [item, cost, id]
        );
    }

};

module.exports = Budget;