const r = require("express").Router();
const c = require("../controllers/reportController");
const auth = require("../middlewares/authMiddleware");
const can = require("../middlewares/authorize");

r.get("/overview", auth, can(["admin", "organizer"]), c.getOverview);
r.get("/events-by-month", auth, can(["admin", "organizer"]), c.getEventsByMonth);
r.get("/attendees", auth, can(["admin", "organizer"]), c.getAttendeesByEvent);
r.get("/budget", auth, can(["admin", "organizer"]), c.getBudgetByEvent);
r.get("/tasks", auth, can(["admin", "organizer"]), c.getTaskStats);
r.get("/events-by-type", auth, can(["admin", "organizer"]), c.getEventsByType);

module.exports = r;
