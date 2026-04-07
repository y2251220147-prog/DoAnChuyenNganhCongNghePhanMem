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
// PATCH /api/events/:id/status  { status: "approved" }
router.patch("/:id/status", auth, authorize(["admin", "organizer"]), c.changeStatus);

// ── Deadlines nội bộ ─────────────────────────
router.get("/:id/deadlines", auth, c.getDeadlines);
router.post("/:id/deadlines", auth, authorize(["admin", "organizer"]), c.createDeadline);
router.patch("/:id/deadlines/:deadlineId", auth, authorize(["admin", "organizer"]), c.toggleDeadline);
router.delete("/:id/deadlines/:deadlineId", auth, authorize(["admin", "organizer"]), c.deleteDeadline);

module.exports = router;
