const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.register = async (req, res) => {

    const { name, email, password } = req.body;

    try {

        const existingUser = await User.findByEmail(email);

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const id = await User.createUser({
            name,
            email,
            password: hashedPassword
        });

        res.json({
            message: "Register success",
            userId: id
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

exports.login = async (req, res) => {

    const { email, password } = req.body;

    try {

        const user = await User.findByEmail(email);

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            "secretkey",
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login success",
            token
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }

};
exports.verifyToken = async (req, res) => {

    try {

        const token = req.headers.authorization.split(" ")[1];

        const decoded = jwt.verify(token, "secretkey");

        res.json({
            message: "Token valid",
            user: decoded
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }

};
exports.resetPassword = async (req, res) => {

    const { oldPassword, newPassword } = req.body;

    try {

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const match = await bcrypt.compare(
            oldPassword,
            user.password
        );

        if (!match) {
            return res.status(400).json({
                message: "Old password incorrect"
            });
        }

        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        await User.updatePassword(
            req.user.id,
            hashedPassword
        );

        res.json({
            message: "Password updated"
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};