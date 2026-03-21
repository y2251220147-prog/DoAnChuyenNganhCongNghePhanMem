const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

router.get("/event/:eventId", auth, taskController.getTasksByEvent);
router.post("/", auth, authorize(["admin", "organizer"]), taskController.createTask);
router.put("/:id", auth, authorize(["admin", "organizer"]), taskController.updateTask);
router.delete("/:id", auth, authorize(["admin", "organizer"]), taskController.deleteTask);

module.exports = router;
