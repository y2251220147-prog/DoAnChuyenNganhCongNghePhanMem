const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/departmentController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

router.use(auth);

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);

// Chỉ admin hoặc organizer mới được thao tác
router.use(authorize(['admin', 'organizer']));
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.delete);

module.exports = router;
