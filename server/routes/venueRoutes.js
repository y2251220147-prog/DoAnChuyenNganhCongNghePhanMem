const r = require("express").Router();
const c = require("../controllers/venueController");
const auth = require("../middlewares/authMiddleware");
const can = require("../middlewares/authorize");
const mgr = ["admin", "organizer"];

// Venues
r.get("/", auth, c.getAll);
r.get("/:id", auth, c.getById);
r.post("/", auth, can(mgr), c.create);
r.put("/:id", auth, can(mgr), c.update);
r.delete("/:id", auth, can(["admin"]), c.delete);

// Venue bookings per event
r.get("/bookings/event/:eventId", auth, c.getEventBookings);
r.post("/bookings", auth, can(mgr), c.bookVenue);
r.patch("/bookings/:id", auth, can(mgr), c.updateBooking);
r.delete("/bookings/:id", auth, can(mgr), c.deleteBooking);

// Resources
r.get("/resources/all", auth, c.getAllResources);
r.get("/resources/event/:eventId", auth, c.getEventResources);
r.post("/resources", auth, can(mgr), c.createResource);
r.put("/resources/:id", auth, can(mgr), c.updateResource);
r.delete("/resources/:id", auth, can(["admin"]), c.deleteResource);
r.post("/resources/bookings", auth, can(mgr), c.bookResource);
r.patch("/resources/bookings/:id", auth, can(mgr), c.updateResBooking);
r.delete("/resources/bookings/:id", auth, can(mgr), c.deleteResBooking);

module.exports = r;
