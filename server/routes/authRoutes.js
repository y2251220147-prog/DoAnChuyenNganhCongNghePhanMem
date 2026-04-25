const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

// POST /api/auth/register
router.post("/register", authController.register);

// POST /api/auth/login
router.post("/login", authController.login);

// POST /api/auth/logout
router.post("/logout", authMiddleware, authController.logout);

// GET /api/auth/verify
router.get("/verify", authMiddleware, authController.verifyToken);

// PUT /api/auth/reset-password
router.put("/reset-password", authMiddleware, authController.resetPassword);

// POST /api/auth/seed  — chỉ hoạt động khi bảng users rỗng
router.post("/seed", authController.seedAdmin);

module.exports = router;
