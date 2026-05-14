const express = require("express");
const {
    getConferences,
    getConference,
    createConference,
    updateConference,
    deleteConference,
    exportApprovedUsersCsv,
    previewConferenceEmail,
    resendConferenceEmail,
    sendConferenceTestEmail
} = require("../controllers/conferenceController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", getConferences);
router.get("/:id/approved-users/export", authMiddleware, adminMiddleware, exportApprovedUsersCsv);
router.get("/:id/email-preview", authMiddleware, adminMiddleware, previewConferenceEmail);
router.get("/:id", getConference);

router.post("/", authMiddleware, adminMiddleware, createConference);
router.post("/:id/resend-email", authMiddleware, adminMiddleware, resendConferenceEmail);
router.post("/:id/test-email", authMiddleware, adminMiddleware, sendConferenceTestEmail);
router.put("/:id", authMiddleware, adminMiddleware, updateConference);
router.delete("/:id", authMiddleware, adminMiddleware, deleteConference);

module.exports = router;
