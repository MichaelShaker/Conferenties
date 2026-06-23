const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
    getAuditLogs,
    getEmailLogs,
    getUsers,
    updateUser,
    getSystemStatus,
    getMaintenanceSettings,
    updateMaintenanceSettings
} = require("../controllers/adminController");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/audit-logs", getAuditLogs);
router.get("/email-logs", getEmailLogs);
router.get("/status", getSystemStatus);
router.get("/maintenance", getMaintenanceSettings);
router.put("/maintenance", updateMaintenanceSettings);
router.get("/users", getUsers);
router.put("/users/:id", updateUser);

module.exports = router;
