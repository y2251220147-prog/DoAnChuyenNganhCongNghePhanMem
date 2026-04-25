const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentController");

// Lấy danh sách phòng ban
router.get("/", departmentController.getAll);
router.get("/:id", departmentController.getById);

// Thêm, sửa, xóa
router.post("/", departmentController.create);
router.put("/:id", departmentController.update);
router.delete("/:id", departmentController.delete);

// Quản lý user trong phòng ban
router.get("/:id/users", departmentController.getUsers);
router.post("/:id/users", departmentController.setUsers);

module.exports = router;
