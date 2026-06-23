const express = require("express");
const maintenanceService = require("../services/maintenanceService");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const settings = await maintenanceService.getMaintenanceSettings();

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error("Maintenance settings error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not fetch maintenance settings"
        });
    }
});

module.exports = router;
