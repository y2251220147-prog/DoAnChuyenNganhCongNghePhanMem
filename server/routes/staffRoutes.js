const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

router.get("/", auth, staffController.getAllStaff);
router.get("/event/:eventId", auth, staffController.getStaffByEvent);
router.post("/event/:eventId", auth, authorize(["admin", "organizer"]), staffController.assignStaff);
router.delete("/:id", auth, authorize(["admin", "organizer"]), staffController.removeStaff);

module.exports = router;