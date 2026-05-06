const r = require("express").Router();
const c = require("../controllers/departmentController");
const auth = require("../middlewares/authMiddleware");
const can = require("../middlewares/authorize");

// ⚠️ Routes cụ thể PHẢI đặt TRƯỚC /:id
r.get("/", auth, c.getAll);
r.get("/eligible-managers", auth, c.getEligibleManagers);

// Employee management routes
r.get("/:id/employees", auth, c.getEmployees);
r.get("/:id/available-users", auth, can(["admin", "organizer"]), c.getAvailableUsers);
r.post("/:id/employees", auth, can(["admin", "organizer"]), c.addEmployee);
r.patch("/:id/employees/:userId", auth, can(["admin", "organizer"]), c.updateEmployeeRole);
r.delete("/:id/employees/:userId", auth, can(["admin", "organizer"]), c.removeEmployee);

// CRUD phòng ban
r.get("/:id", auth, c.getById);
r.post("/", auth, can(["admin", "organizer"]), c.create);
r.put("/:id", auth, can(["admin", "organizer"]), c.update);
r.delete("/:id", auth, can(["admin"]), c.delete);

module.exports = r;
