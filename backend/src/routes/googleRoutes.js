const express = require("express");
const googleController = require("../controllers/googleController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/status", authMiddleware, adminMiddleware, googleController.getStatus);
router.get("/auth-url", authMiddleware, adminMiddleware, googleController.getAuthUrl);
router.get("/callback", googleController.handleCallback);
router.post("/conferences/sync-all", authMiddleware, adminMiddleware, googleController.syncAllConferences);
router.post("/conferences/:id/sync", authMiddleware, adminMiddleware, googleController.syncConference);

module.exports = router;
