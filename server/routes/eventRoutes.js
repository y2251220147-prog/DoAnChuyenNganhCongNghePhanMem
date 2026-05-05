const express = require("express");
const router = express.Router();
const c = require("../controllers/eventController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

// ── Events CRUD ──────────────────────────────
// QUAN TRỌNG: route /search phải đứng TRƯỚC /:id
router.get("/search", auth, c.searchEvents);
router.get("/", auth, c.getAllEvents);
router.get("/:id", auth, c.getEventById);
router.post("/", auth, authorize(["admin", "organizer"]), c.createEvent);
router.put("/:id", auth, authorize(["admin", "organizer"]), c.updateEvent);
router.delete("/:id", auth, authorize(["admin", "organizer"]), c.deleteEvent);

// ── Workflow: chuyển trạng thái ───────────────
router.patch("/:id/status", auth, authorize(["admin", "organizer"]), c.changeStatus);

module.exports = router;
