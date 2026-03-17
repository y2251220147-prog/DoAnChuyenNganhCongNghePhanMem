const db = require("../config/database");

const Guest = {

    getAll: async () => {
        const [rows] = await db.query("SELECT * FROM guests");
        return rows;
    },

    create: async (guest) => {
        const { event_id, name, email } = guest;

        const [result] = await db.query(
            "INSERT INTO guests (event_id, name, email) VALUES (?, ?, ?)",
            [event_id, name, email]
        );

        return result.insertId;
    }

};

module.exports = Guest;