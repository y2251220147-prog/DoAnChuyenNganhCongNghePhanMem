const r = require("express").Router();
const c = require("../controllers/taskController");
const auth = require("../middlewares/authMiddleware");
const can = require("../middlewares/authorize");
const mgr = ["admin", "organizer"];

// Phases
r.get("/phases/event/:eventId", auth, c.getPhases);
r.post("/phases", auth, can(mgr), c.createPhase);
r.put("/phases/:id", auth, can(mgr), c.updatePhase);
r.delete("/phases/:id", auth, can(mgr), c.deletePhase);

// Tasks
r.get("/event/:eventId", auth, c.getByEvent);
r.get("/stats/:eventId", auth, c.getStats);
r.get("/:id", auth, c.getById);
r.post("/", auth, can(mgr), c.create);
r.put("/:id", auth, can(mgr), c.update);
r.patch("/:id/status", auth, c.updateStatus);       // all logged-in
r.patch("/:id/progress", auth, c.updateProgress);     // all logged-in
r.patch("/:id/feedback", auth, c.updateFeedback);     // all logged-in

r.delete("/:id", auth, can(mgr), c.delete);

// Comments
r.get("/:taskId/comments", auth, c.getComments);
r.post("/:taskId/comments", auth, c.addComment);
r.delete("/:taskId/comments/:commentId", auth, c.deleteComment);

// History
r.get("/:taskId/history", auth, c.getHistory);

// Reminders (cron hoặc admin trigger)
r.post("/reminders/trigger", auth, can(["admin"]), c.triggerReminders);

module.exports = r;
