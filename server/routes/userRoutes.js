const express = require("express");
const router = express.Router();
const c = require("../controllers/userController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

router.get("/", auth, authorize(["admin", "organizer"]), c.getUsers);
router.post("/", auth, authorize(["admin"]), c.addUser);

// Profile routes (Any authenticated user)
router.get("/profile", auth, c.getProfile);
router.put("/profile", auth, c.updateProfile);

router.put("/:id/role", auth, authorize(["admin"]), c.changeRole);
router.patch("/:id/department", auth, authorize(["admin", "organizer"]), c.changeDepartment);
router.delete("/:id", auth, authorize(["admin"]), c.deleteUser);

module.exports = router;
