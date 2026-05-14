function createRateLimiter({ windowMs, max, message }) {
    const attempts = new Map();

    return function rateLimitMiddleware(req, res, next) {
        const key = `${req.ip}:${req.originalUrl}`;
        const now = Date.now();
        const current = attempts.get(key) || {
            count: 0,
            resetAt: now + windowMs
        };

        if (now > current.resetAt) {
            current.count = 0;
            current.resetAt = now + windowMs;
        }

        current.count += 1;
        attempts.set(key, current);

        if (current.count > max) {
            return res.status(429).json({
                success: false,
                message
            });
        }

        next();
    };
}

module.exports = {
    createRateLimiter
};
