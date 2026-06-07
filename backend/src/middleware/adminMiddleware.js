const pool = require("../config/db");
const { sendError } = require("../utils/apiError");

async function adminMiddleware(req, res, next) {
    if (!req.user?.id) {
        return sendError(res, 403, "ADMIN_ACCESS_REQUIRED", {
            message: "Je hebt geen beheerrechten.",
            description: "Deze pagina of actie is alleen voor beheerders.",
            action: "Log in met een beheerdersaccount of vraag een beheerder om hulp."
        });
    }

    try {
        const [rows] = await pool.query(
            "SELECT id, role FROM users WHERE id = ? LIMIT 1",
            [req.user.id]
        );

        const user = rows[0];

        if (!user || user.role !== "admin") {
            return sendError(res, 403, "ADMIN_ACCESS_REQUIRED", {
                message: "Je hebt geen beheerrechten.",
                description: "Deze pagina of actie is alleen voor beheerders.",
                action: "Log in met een beheerdersaccount of vraag een beheerder om hulp."
            });
        }

        req.user.role = user.role;
        next();
    } catch (error) {
        console.error("Admin middleware error:", error.message);

        return sendError(res, 500, "ADMIN_ACCESS_CHECK_FAILED", {
            message: "We konden je rechten niet controleren.",
            description: "Er ging iets mis bij het controleren van je accountrechten.",
            action: "Ververs de pagina. Blijft dit gebeuren, geef de foutcode door aan support."
        });
    }
}

module.exports = adminMiddleware;
