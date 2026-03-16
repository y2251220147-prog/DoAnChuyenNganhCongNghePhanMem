const db = require("../config/database");

const Timeline = {

    async getAll() {
        const [rows] = await db.query(
            "SELECT * FROM event_timeline"
        );
        return rows;
    },

    async create(data) {

        const { event_id, title, start_time, end_time, description } = data;

        const [result] = await db.query(
            "INSERT INTO event_timeline(event_id,title,start_time,end_time,description) VALUES(?,?,?,?,?)",
            [event_id, title, start_time, end_time, description]
        );

        return result.insertId;
    }

};

module.exports = Timeline;