const express = require("express");
const router = express.Router();
const c = require("../controllers/departmentController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

// Tạm thời cho Admin và Organizer thao tác trên phòng ban
router.get("/", auth, c.getAllDepartments);
router.get("/:id", auth, c.getDepartmentById);
router.post("/", auth, authorize(["admin", "organizer"]), c.createDepartment);
router.put("/:id", auth, authorize(["admin", "organizer"]), c.updateDepartment);
router.delete("/:id", auth, authorize(["admin", "organizer"]), c.deleteDepartment);

module.exports = router;
