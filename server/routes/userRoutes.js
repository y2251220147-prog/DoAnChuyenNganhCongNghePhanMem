const express = require("express");
const router = express.Router();
const c = require("../controllers/userController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

// Profile routes (Must be before /:id routes to avoid "profile" being treated as an id)
router.get("/profile", auth, c.getProfile);
router.put("/profile", auth, c.updateProfile);

router.get("/", auth, authorize(["admin"]), c.getUsers);
router.post("/", auth, authorize(["admin"]), c.addUser);
router.put("/:id/role", auth, authorize(["admin"]), c.changeRole);
router.delete("/:id", auth, authorize(["admin"]), c.deleteUser);

module.exports = router;
