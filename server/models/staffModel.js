const db = require("../config/database");

exports.getAll = async () => {

    const [rows] = await db.query(
        "SELECT * FROM event_staff"
    );

    return rows;

};

exports.assign = async (data) => {

    const [result] = await db.query(
        "INSERT INTO event_staff (event_id, user_id, role) VALUES (?, ?, ?)",
        [data.event_id, data.user_id, data.role]
    );

    return result.insertId;

};