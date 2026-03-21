const express = require("express");
const router = express.Router();
const partnerController = require("../controllers/partnerController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

router.get("/", auth, partnerController.getAllPartners);
router.get("/event/:eventId", auth, partnerController.getPartnersByEvent);
router.post("/event/:eventId", auth, authorize(["admin", "organizer"]), partnerController.addPartner);
router.delete("/:id", auth, authorize(["admin", "organizer"]), partnerController.deletePartner);

module.exports = router;
