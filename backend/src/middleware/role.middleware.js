
 // Decides which roles can access an API
const allowRoles = (...allowedRoles) => {
    const normalizedRoles = allowedRoles.map(role =>
        String(role).trim().toLowerCase()
    );

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const userRole = String(req.user.role || "")
            .trim()
            .toLowerCase();

        if (!normalizedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You do not have permission."
            });
        }

        next();
    };
};

module.exports = allowRoles;
