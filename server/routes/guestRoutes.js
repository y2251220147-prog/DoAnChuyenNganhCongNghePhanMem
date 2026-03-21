const express = require("express");
const router = express.Router();
const guestController = require("../controllers/guestController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

router.get("/", auth, guestController.getAllGuests);
router.get("/event/:eventId", auth, guestController.getGuestsByEvent);
router.post("/event/:eventId", auth, authorize(["admin", "organizer"]), guestController.addGuest);
router.put("/:id", auth, authorize(["admin", "organizer"]), guestController.updateGuest);
router.delete("/:id", auth, authorize(["admin", "organizer"]), guestController.deleteGuest);
router.put("/:id/checkin", auth, authorize(["admin", "organizer"]), guestController.toggleCheckin);

module.exports = router;