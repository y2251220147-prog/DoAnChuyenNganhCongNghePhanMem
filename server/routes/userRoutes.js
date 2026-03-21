const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

// Admin only User Management APIs
router.get(
    "/",
    auth,
    authorize(["admin"]),
    userController.getUsers
);

router.post(
    "/",
    auth,
    authorize(["admin"]),
    userController.addUser
);

router.put(
    "/:id/role",
    auth,
    authorize(["admin"]),
    userController.changeRole
);

module.exports = router;