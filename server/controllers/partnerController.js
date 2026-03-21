const Partner = require("../models/partnerModel");

exports.getAllPartners = async (req, res) => {
    try {
        const row = await Partner.getAll();
        res.json(row);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getPartnersByEvent = async (req, res) => {
    try {
        const row = await Partner.getByEventId(req.params.eventId);
        res.json(row);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addPartner = async (req, res) => {
    try {
        const id = await Partner.create({ ...req.body, event_id: req.params.eventId });
        res.status(201).json({ id, message: "Thêm đối tác thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deletePartner = async (req, res) => {
    try {
        await Partner.delete(req.params.id);
        res.json({ message: "Xoá đối tác thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
