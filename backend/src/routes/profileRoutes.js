const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
    getMyProfile,
    updateMyProfile
} = require("../controllers/ProfileController");

const router = express.Router();

router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, updateMyProfile);

module.exports = router;