const express = require("express");
const router = express.Router();
const budgetController = require("../controllers/budgetController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

// GET /api/budgets  - lấy tất cả budget
router.get("/", authMiddleware, budgetController.getAllBudgets);

// GET /api/budgets/event/:eventId  - lấy budget theo sự kiện
router.get("/event/:eventId", authMiddleware, budgetController.getBudgetsByEvent);

// POST /api/budgets  - tạo budget item (admin, organizer)
router.post("/", authMiddleware, authorize(["admin", "organizer"]), budgetController.createBudget);

// PUT /api/budgets/:id  - cập nhật budget item (admin, organizer)
router.put("/:id", authMiddleware, authorize(["admin", "organizer"]), budgetController.updateBudget);

// DELETE /api/budgets/:id  - xóa budget item (admin, organizer)
router.delete("/:id", authMiddleware, authorize(["admin", "organizer"]), budgetController.deleteBudget);

module.exports = router;
