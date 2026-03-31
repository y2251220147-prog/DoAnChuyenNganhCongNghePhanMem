const r = require("express").Router();
const c = require("../controllers/attendeeController");
const auth = require("../middlewares/authMiddleware");
const can = require("../middlewares/authorize");

r.get("/", auth, can(["admin", "organizer"]), c.getAll);
r.get("/me", auth, c.getMyRegistrations);
r.get("/event/:eventId", auth, c.getByEvent);
r.get("/stats/:eventId", auth, c.getStats);
r.get("/check/:eventId", auth, c.checkReg);
r.post("/external", auth, can(["admin", "organizer"]), c.addExternal);
r.post("/register/:eventId", auth, c.selfRegister);
r.delete("/:id", auth, c.remove);

module.exports = r;
