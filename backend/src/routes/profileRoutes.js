const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
    getMyProfile,
    updateMyProfile
} = require("../controllers/profileController");

const router = express.Router();

router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, updateMyProfile);

module.exports = router;
