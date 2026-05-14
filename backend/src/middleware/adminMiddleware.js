const pool = require("../config/db");

async function adminMiddleware(req, res, next) {
    if (!req.user?.id) {
        return res.status(403).json({
            success: false,
            message: "Forbidden: admin access required"
        });
    }

    try {
        const [rows] = await pool.query(
            "SELECT id, role FROM users WHERE id = ? LIMIT 1",
            [req.user.id]
        );

        const user = rows[0];

        if (!user || user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Forbidden: admin access required"
            });
        }

        req.user.role = user.role;
        next();
    } catch (error) {
        console.error("Admin middleware error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Could not verify admin access"
        });
    }
}

module.exports = adminMiddleware;
