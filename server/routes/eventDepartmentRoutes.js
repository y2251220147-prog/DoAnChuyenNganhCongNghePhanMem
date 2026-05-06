const r = require("express").Router();
const c = require("../controllers/eventDepartmentController");
const auth = require("../middlewares/authMiddleware");
const can = require("../middlewares/authorize");

r.get("/", auth, c.getAll);
r.get("/event/:eventId", auth, c.getByEvent);
r.post("/", auth, can(["admin", "organizer"]), c.assign);
r.put("/:id", auth, can(["admin", "organizer"]), c.update);
r.delete("/:id", auth, can(["admin", "organizer"]), c.remove);

module.exports = r;
