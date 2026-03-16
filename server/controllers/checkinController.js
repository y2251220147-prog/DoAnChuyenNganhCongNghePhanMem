const db = require("../config/database");

exports.checkin = async (req, res) => {

    const { qr_code } = req.body;

    await db.query(
        "UPDATE guests SET checked_in=1 WHERE qr_code=?",
        [qr_code]
    );

    res.json({
        message: "checked in"
    });

};