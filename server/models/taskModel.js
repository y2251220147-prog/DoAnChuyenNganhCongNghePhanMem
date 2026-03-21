const db = require("../config/database")

const Task = {
    getByEvent: async (eventId) => {
        const [rows] = await db.query(
            "SELECT * FROM event_execution_tasks WHERE event_id = ? ORDER BY phase, due_date",
            [eventId]
        );
        return rows;
    },
    create: async (data) => {
        const { event_id, task_name, phase, assigned_to, due_date } = data;
        const [result] = await db.query(
            "INSERT INTO event_execution_tasks (event_id, task_name, phase, assigned_to, due_date) VALUES (?, ?, ?, ?, ?)",
            [event_id, task_name, phase, assigned_to, due_date]
        );
        return result.insertId;
    },
    update: async (id, data) => {
        const fields = Object.keys(data).map(key => `${key} = ?`).join(", ");
        const values = [...Object.values(data), id];
        const [result] = await db.query(`UPDATE event_execution_tasks SET ${fields} WHERE id = ?`, values);
        return result.affectedRows;
    },
    delete: async (id) => {
        const [result] = await db.query("DELETE FROM event_execution_tasks WHERE id = ?", [id]);
        return result.affectedRows;
    }
};

module.exports = Task;
