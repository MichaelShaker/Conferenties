const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
    registerForConference,
    getMyRegistrations,
    getAllRegistrations,
    updateRegistration,
    uploadPaymentProof,
    cancelRegistration,
    resendRegistrationEmail
} = require("../controllers/registrationController");

// user routes
router.post("/", authMiddleware, registerForConference);
router.get("/mine", authMiddleware, getMyRegistrations);
router.put("/:id/cancel", authMiddleware, cancelRegistration);

// admin routes
router.get("/", authMiddleware, adminMiddleware, getAllRegistrations);
router.put("/:id", authMiddleware, adminMiddleware, updateRegistration);
router.post("/:id/resend-email", authMiddleware, adminMiddleware, resendRegistrationEmail);
router.put("/:id/payment-proof", authMiddleware, uploadPaymentProof);

module.exports = router;
