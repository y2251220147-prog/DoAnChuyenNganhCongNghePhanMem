const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const SALT_ROUNDS = 10;

const register = async ({ name, email, password }) => {
    if (!name || !email || !password)
        throw { status: 400, message: "Name, email and password are required" };
    if (password.length < 6)
        throw { status: 400, message: "Password must be at least 6 characters" };

    const existing = await User.findByEmail(email);
    if (existing) throw { status: 400, message: "Email already exists" };

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const id = await User.createUser({ name, email, password: hashedPassword, role: "user" });
    return { userId: id };
};

const login = async ({ email, password }) => {
    if (!email || !password)
        throw { status: 400, message: "Email and password are required" };

    const user = await User.findByEmail(email);
    if (!user) throw { status: 401, message: "Invalid email or password" };

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw { status: 401, message: "Invalid email or password" };

    const token = jwt.sign(
        { id: user.id, role: user.role, name: user.name, email: user.email },
        JWT_SECRET,
        { expiresIn: "2h" }
    );
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

const resetPassword = async (userId, { oldPassword, newPassword }) => {
    if (!oldPassword || !newPassword)
        throw { status: 400, message: "oldPassword and newPassword are required" };
    if (newPassword.length < 6)
        throw { status: 400, message: "New password must be at least 6 characters" };

    const user = await User.findById(userId);
    if (!user) throw { status: 404, message: "User not found" };

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) throw { status: 400, message: "Old password incorrect" };

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await User.updatePassword(userId, hashed);
};

module.exports = { register, login, resetPassword };
