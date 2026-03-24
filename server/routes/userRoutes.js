const express = require("express");
const router = express.Router();
const c = require("../controllers/userController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

router.get("/", auth, authorize(["admin"]), c.getUsers);
router.post("/", auth, authorize(["admin"]), c.addUser);
router.put("/:id/role", auth, authorize(["admin"]), c.changeRole);
router.delete("/:id", auth, authorize(["admin"]), c.deleteUser);

module.exports = router;
