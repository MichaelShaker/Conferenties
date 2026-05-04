const express = require("express");
const {
    getConferences,
    getConference,
    createConference,
    updateConference,
    deleteConference
} = require("../controllers/conferenceController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", getConferences);
router.get("/:id", getConference);

router.post("/", authMiddleware, adminMiddleware, createConference);
router.put("/:id", authMiddleware, adminMiddleware, updateConference);
router.delete("/:id", authMiddleware, adminMiddleware, deleteConference);

module.exports = router;