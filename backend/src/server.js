require("dotenv").config();
const app = require("./app");
const pool = require("./config/db");
const { ensureAppSchema } = require("./services/schemaService");

const PORT = process.env.PORT || 3002;
const DB_STARTUP_RETRIES = Number(process.env.DB_STARTUP_RETRIES || 30);
const DB_STARTUP_RETRY_DELAY_MS = Number(process.env.DB_STARTUP_RETRY_DELAY_MS || 2000);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function connectDatabaseWithRetry() {
    let lastError = null;

    for (let attempt = 1; attempt <= DB_STARTUP_RETRIES; attempt += 1) {
        try {
            const connection = await pool.getConnection();
            console.log("Database connected successfully");
            connection.release();

            await ensureAppSchema();
            return;
        } catch (error) {
            lastError = error;
            console.warn(
                `Database not ready yet (${attempt}/${DB_STARTUP_RETRIES}): ${error.message}`
            );

            if (attempt < DB_STARTUP_RETRIES) {
                await sleep(DB_STARTUP_RETRY_DELAY_MS);
            }
        }
    }

    throw lastError;
}

async function startServer() {
    try {
        if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
            throw new Error("JWT_SECRET must be set to a strong value of at least 32 characters");
        }

        await connectDatabaseWithRetry();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

startServer();
