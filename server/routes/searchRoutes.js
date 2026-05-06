const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");
const auth = require("../middlewares/authMiddleware");

// GET /api/search?q=keyword
router.get("/", auth, searchController.globalSearch);

module.exports = router;
