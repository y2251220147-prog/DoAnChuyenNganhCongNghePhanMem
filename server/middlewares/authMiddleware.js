const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_production";

module.exports = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};
