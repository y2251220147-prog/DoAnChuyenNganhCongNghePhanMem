const jwt = require("jsonwebtoken");
const authService = require("../services/authService");

// Đảm bảo JWT_SECRET đồng nhất với authService.js
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

if (!process.env.JWT_SECRET) {
    console.warn("⚠️  WARNING: JWT_SECRET not set in environment. Using insecure default. Set it in .env for production.");
}

module.exports = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
        const isBlacklisted = await authService.isTokenBlacklisted(token);
        if (isBlacklisted) {
            return res.status(401).json({ message: "Session expired, please login again" });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};
