module.exports = (roles) => {
    return (req, res, next) => {
        const userRole = req.user.role?.toString().trim().toLowerCase();
        const allowedRoles = roles.map(r => r.toString().trim().toLowerCase());

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                message: `Quyền truy cập bị từ chối. Vai trò hiện tại: "${userRole}"`
            });
        }
        next();
    };
};