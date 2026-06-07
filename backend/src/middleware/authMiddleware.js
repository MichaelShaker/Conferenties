const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/apiError");

function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return sendError(res, 401, "AUTH_LOGIN_REQUIRED", {
                message: "Log in om verder te gaan.",
                description: "Voor deze pagina of actie moet je ingelogd zijn.",
                action: "Log in met je account en probeer het opnieuw."
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
            return sendError(res, 401, "AUTH_SESSION_INVALID", {
                message: "Je login is niet meer geldig.",
                description: "Je sessie mist accountgegevens die nodig zijn om verder te gaan.",
                action: "Log uit, log opnieuw in en probeer het daarna nog een keer."
            });
        }

        next();
    } catch (error) {
        console.error("Auth error:", error.message);

        return sendError(res, 401, "AUTH_SESSION_EXPIRED", {
            message: "Je sessie is verlopen.",
            description: "Dat gebeurt soms als je lang niets hebt gedaan of opnieuw bent ingelogd op een ander apparaat.",
            action: "Log opnieuw in en probeer het daarna nog een keer."
        });
    }
}

module.exports = authMiddleware;
