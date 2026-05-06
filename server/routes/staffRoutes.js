const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

router.get("/", authMiddleware, staffController.getAllStaff);
router.get("/event/:eventId", authMiddleware, staffController.getStaffByEvent);
router.post("/", authMiddleware, authorize(["admin", "organizer"]), staffController.assignStaff);
router.post("/by-department", authMiddleware, authorize(["admin", "organizer"]), staffController.assignByDepartment);
router.delete("/:id", authMiddleware, authorize(["admin", "organizer"]), staffController.removeStaff);

module.exports = router;
