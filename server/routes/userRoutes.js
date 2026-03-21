const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

// PROFILE ROUTES (any authenticated user)
router.get("/profile", auth, userController.getProfile);
router.put("/profile", auth, userController.updateProfile);

// USER LIST (admin and organizer can view)
router.get(
    "/users",
    auth,
    authorize(["admin", "organizer"]),
    userController.getUsers
);

// ADMIN-ONLY ROUTES
router.post(
    "/users",
    auth,
    authorize(["admin"]),
    userController.createUser
);

router.put(
    "/users/:id",
    auth,
    authorize(["admin"]),
    userController.updateUser
);

router.put(
    "/users/:id/role",
    auth,
    authorize(["admin"]),
    userController.changeRole
);

router.delete(
    "/users/:id",
    auth,
    authorize(["admin"]),
    userController.deleteUser
);

module.exports = router;