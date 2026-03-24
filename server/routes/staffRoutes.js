const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");

router.get("/", staffController.getAllStaff);
router.post("/", staffController.assignStaff);

module.exports = router;