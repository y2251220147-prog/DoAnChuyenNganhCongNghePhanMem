const r = require("express").Router();
const c = require("../controllers/taskController");
const auth = require("../middlewares/authMiddleware");
const can = require("../middlewares/authorize");
const mgr = ["admin", "organizer"];



// Tasks
r.get("/my", auth, c.getMyTasks);
r.get("/event/:eventId", auth, c.getByEvent);
r.get("/stats/:eventId", auth, c.getStats);
r.get("/:id", auth, c.getById);
r.post("/", auth, can(mgr), c.create);
r.put("/:id", auth, can(mgr), c.update);
r.patch("/:id/status", auth, c.updateStatus);       // all logged-in
r.patch("/:id/progress", auth, c.updateProgress);   // all logged-in
r.patch("/:id/report-issue", auth, c.reportIssue);  // all logged-in
r.patch("/:id/feedback", auth, c.updateFeedback);   // all logged-in
r.delete("/:id", auth, can(mgr), c.delete);

// Comments
r.get("/:taskId/comments", auth, c.getComments);
r.post("/:taskId/comments", auth, c.addComment);
r.delete("/:taskId/comments/:commentId", auth, c.deleteComment);

// History
r.get("/:taskId/history", auth, c.getHistory);

module.exports = r;
