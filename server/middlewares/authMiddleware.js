const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {

        const decoded = jwt.verify(token, "secretkey");

        req.user = decoded;

        next();

        // eslint-disable-next-line no-unused-vars
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }

};