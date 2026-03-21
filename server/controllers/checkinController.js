const db = require("../config/database");

exports.checkin = async (req, res) => {
    const { qr_code } = req.body;

    if (!qr_code || !qr_code.trim()) {
        return res.status(400).json({ message: "QR code is required" });
    }

    try {
        const [guests] = await db.query(
            "SELECT * FROM guests WHERE qr_code = ?",
            [qr_code.trim()]
        );

        if (guests.length === 0) {
            return res.status(404).json({ message: "Guest not found with this QR code" });
        }

        const guest = guests[0];

        if (guest.checked_in) {
            return res.status(409).json({ message: `Guest "${guest.name}" has already checked in` });
        }

        await db.query(
            "UPDATE guests SET checked_in = 1 WHERE qr_code = ?",
            [qr_code.trim()]
        );

        res.json({ message: `Check-in successful! Welcome, ${guest.name}` });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
