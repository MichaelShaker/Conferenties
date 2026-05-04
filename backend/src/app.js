const express = require("express");
const cors = require("cors");

const conferenceRoutes = require("./routes/conferenceRoutes");
const authRoutes = require("./routes/authRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const profileRoutes = require("./routes/profileRoutes");
const churchRoutes = require("./routes/churchRoutes");
const passwordResetRoutes = require("./routes/passwordResetRoutes");
const khelwaRoutes = require('./routes/khelwa/khelwaRoutes');

const app = express();

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"]
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Backend is running"
    });
});

app.use('/api/khelwa', khelwaRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/conferences", conferenceRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/churches", churchRoutes);
app.use("/api/password", passwordResetRoutes);

module.exports = app;