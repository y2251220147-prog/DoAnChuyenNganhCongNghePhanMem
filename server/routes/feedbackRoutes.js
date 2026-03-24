const express = require("express");
const router = express.Router();
const c = require("../controllers/feedbackController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

router.get("/", auth, authorize(["admin", "organizer"]), c.getAllFeedback);
router.get("/event/:eventId", auth, c.getFeedbackByEvent);
router.post("/", c.createFeedback);  // public - guest không cần login
router.delete("/:id", auth, authorize(["admin", "organizer"]), c.deleteFeedback);

module.exports = router;
