const express = require("express");
const cors = require("cors");
const securityHeadersMiddleware = require("./middleware/securityHeadersMiddleware");
const { createRateLimiter } = require("./middleware/rateLimitMiddleware");

const conferenceRoutes = require("./routes/conferenceRoutes");
const authRoutes = require("./routes/authRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const profileRoutes = require("./routes/profileRoutes");
const churchRoutes = require("./routes/churchRoutes");
const passwordResetRoutes = require("./routes/passwordResetRoutes");
const khelwaRoutes = require('./routes/khelwa/khelwaRoutes');
const googleRoutes = require("./routes/googleRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(securityHeadersMiddleware);
app.use(cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use((req, res, next) => {
    const startedAt = Date.now();

    res.on("finish", () => {
        const durationMs = Date.now() - startedAt;

        if (durationMs > 1000) {
            console.warn(`Slow request: ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
        }
    });

    next();
});

const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many attempts. Please try again later."
});

const passwordResetRateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: "Too many password reset attempts. Please try again later."
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Backend is running"
    });
});

app.use('/api/khelwa', khelwaRoutes);
app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/conferences", conferenceRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/churches", churchRoutes);
app.use("/api/password", passwordResetRateLimiter, passwordResetRoutes);
app.use("/api/google", googleRoutes);
app.use("/api/admin", adminRoutes);

module.exports = app;
