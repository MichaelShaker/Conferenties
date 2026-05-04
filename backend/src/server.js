require("dotenv").config();
const app = require("./app");
const pool = require("./config/db");

const PORT = process.env.PORT || 3002;

async function startServer() {
    try {
        const connection = await pool.getConnection();
        console.log("Database connected successfully");
        connection.release();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
    }
}

startServer();