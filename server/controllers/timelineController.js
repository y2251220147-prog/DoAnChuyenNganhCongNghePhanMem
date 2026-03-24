const db = require("../config/database");

exports.getAllTimeline = (req, res) => {

    const sql = "SELECT * FROM event_timeline";

    db.query(sql, (err, results) => {

        if (err) {
            console.error("Timeline GET error:", err);
            return res.status(500).json({ error: err.message });
        }

        res.status(200).json(results);

    });

};

exports.createTimeline = (req, res) => {

    const { event_id, title, start_time, end_time, description } = req.body;

    const sql = `
        INSERT INTO event_timeline
        (event_id, title, start_time, end_time, description)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [event_id, title, start_time, end_time, description],
        (err, result) => {

            if (err) {
                console.error("Timeline INSERT error:", err);
                return res.status(500).json({ error: err.message });
            }

            res.status(200).json({
                message: "Timeline created",
                id: result.insertId
            });

        }
    );

};