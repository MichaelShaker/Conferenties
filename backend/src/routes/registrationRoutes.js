const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
    registerForConference,
    getMyRegistrations,
    getAllRegistrations,
    getRegistrationPaymentProof,
    updateRegistration,
    uploadPaymentProof,
    cancelRegistration,
    resendRegistrationEmail,
    sendCustomRegistrationEmail
} = require("../controllers/registrationController");

// user routes
router.post("/", authMiddleware, registerForConference);
router.get("/mine", authMiddleware, getMyRegistrations);
router.put("/:id/cancel", authMiddleware, cancelRegistration);

// admin routes
router.get("/", authMiddleware, adminMiddleware, getAllRegistrations);
router.get("/:id/payment-proof", authMiddleware, adminMiddleware, getRegistrationPaymentProof);
router.put("/:id", authMiddleware, adminMiddleware, updateRegistration);
router.post("/:id/resend-email", authMiddleware, adminMiddleware, resendRegistrationEmail);
router.post("/:id/custom-email", authMiddleware, adminMiddleware, sendCustomRegistrationEmail);
router.put("/:id/payment-proof", authMiddleware, uploadPaymentProof);

module.exports = router;
