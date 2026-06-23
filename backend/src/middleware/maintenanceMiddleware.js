const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const maintenanceService = require("../services/maintenanceService");

const PUBLIC_ALLOWED_PATHS = [
    "/api/health",
    "/api/maintenance",
    "/api/auth/login",
    "/api/password"
];

function isPubliclyAllowedPath(path) {
    return PUBLIC_ALLOWED_PATHS.some(allowedPath => path === allowedPath || path.startsWith(`${allowedPath}/`));
}

async function isAdminRequest(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return false;
    }

    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded?.id) {
            return false;
        }

        const [rows] = await pool.query(
            "SELECT role FROM users WHERE id = ? LIMIT 1",
            [decoded.id]
        );

        return rows[0]?.role === "admin";
    } catch (error) {
        return false;
    }
}

async function maintenanceMiddleware(req, res, next) {
    try {
        const settings = await maintenanceService.getMaintenanceSettings();

        if (!settings.enabled || isPubliclyAllowedPath(req.path) || await isAdminRequest(req)) {
            return next();
        }

        return res.status(503).json({
            success: false,
            code: "MAINTENANCE_MODE",
            message: settings.title,
            description: settings.message,
            action: settings.expectedBackAt || "Probeer het later opnieuw.",
            data: settings
        });
    } catch (error) {
        console.error("Maintenance middleware error:", error.message);
        next();
    }
}

module.exports = maintenanceMiddleware;
