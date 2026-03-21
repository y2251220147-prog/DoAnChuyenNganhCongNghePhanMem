const express = require("express");
const router = express.Router();
const budgetController = require("../controllers/budgetController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

router.get("/", auth, budgetController.getAllBudgets);
router.get("/event/:eventId", auth, budgetController.getBudgetByEvent);
router.post("/event/:eventId", auth, authorize(["admin", "organizer"]), budgetController.addBudget);
router.put("/:id", auth, authorize(["admin", "organizer"]), budgetController.updateBudget);
router.delete("/:id", auth, authorize(["admin", "organizer"]), budgetController.deleteBudget);

module.exports = router;