const express = require("express");
const router = express.Router();

const khelwaController = require("../../controllers/khelwa/khelwaController");
const authMiddleware = require("../../middleware/authMiddleware");
const adminMiddleware = require("../../middleware/adminMiddleware");
const authMiddlewareOptional = require("../../middleware/optionalAuthMiddleware");

// Public routes
router.get("/availability", khelwaController.getAvailability);
router.post(
    "/reserve",
    authMiddleware,
    khelwaController.createReservation
)
router.get(
    "/my-reservations",
    authMiddleware,
    khelwaController.getMyReservations
)

// Admin routes
router.get(
    "/admin/reservations",
    authMiddleware,
    adminMiddleware,
    khelwaController.getAllReservations
);

router.patch(
    "/admin/reservations/:id/approve",
    authMiddleware,
    adminMiddleware,
    khelwaController.approveReservation
);

router.patch(
    "/admin/reservations/:id/reject",
    authMiddleware,
    adminMiddleware,
    khelwaController.rejectReservation
);

router.post(
    "/admin/block-date",
    authMiddleware,
    adminMiddleware,
    khelwaController.blockDate
);

module.exports = router;