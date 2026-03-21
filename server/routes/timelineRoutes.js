const express = require("express");
const router = express.Router();
const timelineController = require("../controllers/timelineController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

router.get("/", auth, timelineController.getAllTimeline);
router.get("/event/:eventId", auth, timelineController.getTimelineByEvent);
router.post("/event/:eventId", auth, authorize(["admin", "organizer"]), timelineController.addTimeline);
router.put("/:id", auth, authorize(["admin", "organizer"]), timelineController.updateTimeline);
router.delete("/:id", auth, authorize(["admin", "organizer"]), timelineController.deleteTimeline);

module.exports = router;