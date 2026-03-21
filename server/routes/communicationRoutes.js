const express = require("express");
const router = express.Router();
const communicationController = require("../controllers/communicationController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

router.get("/", auth, communicationController.getAllComm);
router.get("/event/:eventId", auth, communicationController.getCommByEvent);
router.post("/event/:eventId", auth, authorize(["admin", "organizer"]), communicationController.addComm);
router.put("/:id", auth, authorize(["admin", "organizer"]), communicationController.updateComm);
router.delete("/:id", auth, authorize(["admin", "organizer"]), communicationController.deleteComm);

module.exports = router;
