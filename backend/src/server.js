require("dotenv").config();
const app = require("./app");
const pool = require("./config/db");
const googleSheetsService = require("./services/googleSheetsService");
const { ensureAppSchema } = require("./services/schemaService");

const PORT = process.env.PORT || 3002;

async function startServer() {
    try {
        if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
            throw new Error("JWT_SECRET must be set to a strong value of at least 32 characters");
        }

        const connection = await pool.getConnection();
        console.log("Database connected successfully");
        connection.release();

        await ensureAppSchema();
        await googleSheetsService.getStatus();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
    }
}

startServer();
