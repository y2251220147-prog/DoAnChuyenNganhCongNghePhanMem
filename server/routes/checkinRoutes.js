const express = require("express");
const router = express.Router();
const checkinController = require("../controllers/checkinController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

// POST /api/checkin — Scan QR check-in (chỉ staff quản lý: organizer, admin)
router.post("/", authMiddleware, authorize(["admin", "organizer"]), checkinController.checkin);

// GET /api/checkin/stats/:eventId — Lấy thống kê check-in
router.get("/stats/:eventId", authMiddleware, checkinController.getStats);

// GET /api/checkin/list/:eventId — Lấy danh sách guests đã/chưa check-in
router.get("/list/:eventId", authMiddleware, checkinController.getCheckinList);

module.exports = router;
