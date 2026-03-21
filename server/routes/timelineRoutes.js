const express = require("express");
const router = express.Router();
const timelineController = require("../controllers/timelineController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

router.get("/", authMiddleware, timelineController.getAllTimeline);
router.get("/event/:eventId", authMiddleware, timelineController.getTimelineByEvent);
router.post("/", authMiddleware, authorize(["admin", "organizer"]), timelineController.createTimeline);
router.put("/:id", authMiddleware, authorize(["admin", "organizer"]), timelineController.updateTimeline);
router.delete("/:id", authMiddleware, authorize(["admin", "organizer"]), timelineController.deleteTimeline);

module.exports = router;
