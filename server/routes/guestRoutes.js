const express = require("express");
const router = express.Router();
const guestController = require("../controllers/guestController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

// Public — không cần đăng nhập (phải đặt TRƯỚC /:id)
router.get("/lookup", guestController.lookupByEmail);

router.get("/", authMiddleware, guestController.getAllGuests);
router.get("/event/:eventId", authMiddleware, guestController.getGuestsByEvent);
router.post("/", authMiddleware, authorize(["admin", "organizer"]), guestController.createGuest);
router.delete("/:id", authMiddleware, authorize(["admin", "organizer"]), guestController.deleteGuest);

module.exports = router;
