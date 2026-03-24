const r = require("express").Router();
const c = require("../controllers/notificationController");
const auth = require("../middlewares/authMiddleware");

r.get("/", auth, c.getMy);
r.get("/count", auth, c.getCount);
r.patch("/:id/read", auth, c.markRead);
r.patch("/read-all", auth, c.markAllRead);
r.delete("/:id", auth, c.delete);

module.exports = r;
