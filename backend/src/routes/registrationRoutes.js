const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
    registerForConference,
    getMyRegistrations,
    getAllRegistrations,
    updateRegistration,
    uploadPaymentProof
} = require("../controllers/registrationController");

// user routes
router.post("/", authMiddleware, registerForConference);
router.get("/mine", authMiddleware, getMyRegistrations);

// admin routes
router.get("/", authMiddleware, adminMiddleware, getAllRegistrations);
router.put("/:id", authMiddleware, adminMiddleware, updateRegistration);
router.put("/:id/payment-proof", authMiddleware, uploadPaymentProof);

module.exports = router;