const express = require("express");
const router = express.Router();
const { getUsers, changeRole } = require("../controllers/userController");
const auth = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");

const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

// REGISTER
router.post("/register", authController.register);

// LOGIN
router.post("/login", authController.login);
// VERIFY TOKEN
router.get("/verify", auth, authController.verifyToken);
// RESET PASSWORD
router.put("/reset-password", auth, authController.resetPassword);

router.get("/users", getUsers);
router.put("/users/:id/role", changeRole);
// ADMIN APIs
router.get(
    "/users",
    auth,
    authorize(["admin"]),
    userController.getUsers
);

router.put(
    "/users/:id/role",
    auth,
    authorize(["admin"]),
    userController.changeRole
);
// VERIFY TOKEN
router.get(
    "/verify",
    auth,
    authController.verifyToken
);
// RESET PASSWORD
router.put(
    "/reset-password",
    auth,
    authController.resetPassword
);
module.exports = router;