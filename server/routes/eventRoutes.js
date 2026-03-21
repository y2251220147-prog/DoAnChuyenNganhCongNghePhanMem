const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

// PUBLIC/ALL ROLES (must be authenticated)
router.get("/", auth, eventController.getAllEvents);
router.get("/:id", auth, eventController.getEventById);

// ADMIN & ORGANIZER ONLY
router.post("/", auth, authorize(["admin", "organizer"]), eventController.createEvent);
router.put("/:id", auth, authorize(["admin", "organizer"]), eventController.updateEvent);
router.delete("/:id", auth, authorize(["admin", "organizer"]), eventController.deleteEvent);

// Join System
router.post("/join", auth, eventController.joinEventByCode);
router.get("/:eventId/participants", auth, eventController.getParticipants);

module.exports = router;