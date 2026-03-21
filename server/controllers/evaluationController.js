const db = require("../config/database")
const Evaluation = require("../models/evaluationModel");

exports.getEvaluationsByEvent = async (req, res) => {
    try {
        const evals = await Evaluation.getByEventId(req.params.eventId);
        res.json(evals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createEvaluation = async (req, res) => {
    try {
        const id = await Evaluation.create(req.body);
        res.json({ message: "Đã tạo đánh giá kpi", id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateEvaluation = async (req, res) => {
    try {
        const { metric, target, actual, notes, invited_count, attended_count, conversion_count, brand_recall_score, lesson_learned } = req.body;
        await db.query(
            `UPDATE event_evaluation SET 
             metric=?, target=?, actual=?, notes=?, 
             invited_count=?, attended_count=?, conversion_count=?, brand_recall_score=?, lesson_learned=? 
             WHERE id = ?`,
            [metric, target, actual, notes, invited_count, attended_count, conversion_count, brand_recall_score, lesson_learned, req.params.id]
        );
        res.json({ message: "Cập nhật thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteEvaluation = async (req, res) => {
    try {
        await Evaluation.delete(req.params.id);
        res.json({ message: "Đã xoá" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
