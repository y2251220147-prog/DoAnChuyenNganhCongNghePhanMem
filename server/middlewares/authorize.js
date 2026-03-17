module.exports = (roles) => {
    return (req, res, next) => {

        const user = req.user;

        if (!roles.includes(user.role)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        next();
    };
};