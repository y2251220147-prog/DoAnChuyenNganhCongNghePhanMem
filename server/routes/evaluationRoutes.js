const express = require("express");
const router = express.Router();
const evaluationController = require("../controllers/evaluationController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

router.get("/event/:eventId", auth, evaluationController.getEvaluationsByEvent);
router.post("/event/:eventId", auth, authorize(["admin", "organizer"]), evaluationController.createEvaluation);
router.put("/:id", auth, authorize(["admin", "organizer"]), evaluationController.updateEvaluation);
router.delete("/:id", auth, authorize(["admin", "organizer"]), evaluationController.deleteEvaluation);

module.exports = router;
