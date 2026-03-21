const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

router.get("/", authMiddleware, eventController.getAllEvents);
router.post("/", authMiddleware, authorize(["admin", "organizer"]), eventController.createEvent);
router.put("/:id", authMiddleware, authorize(["admin", "organizer"]), eventController.updateEvent);
router.delete("/:id", authMiddleware, authorize(["admin", "organizer"]), eventController.deleteEvent);

module.exports = router;
