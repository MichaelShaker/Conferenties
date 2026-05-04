const jwt = require("jsonwebtoken")

function optionalAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next()
    }

    try {
        const token = authHeader.split(" ")[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded
    } catch (error) {
        req.user = null
    }

    next()
}

module.exports = optionalAuthMiddleware