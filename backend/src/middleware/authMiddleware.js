const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: no token provided"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            id: decoded.id,
            username: decoded.username,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role
        };

        if (!req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: token does not contain user id"
            });
        }

        next();
    } catch (error) {
        console.error("Auth error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Unauthorized: invalid or expired token"
        });
    }
}

module.exports = authMiddleware;
