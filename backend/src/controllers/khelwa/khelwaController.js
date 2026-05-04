const khelwaService = require("../../services/khelwa/khelwaService");

async function getAvailability(req, res) {
    try {
        const { month } = req.query;

        if (!month) {
            return res.status(400).json({
                success: false,
                message: "Month is required. Example: 2026-05"
            });
        }

        const availability = await khelwaService.getAvailability(month);

        res.json({
            success: true,
            data: availability
        });
    } catch (error) {
        console.error("getAvailability error:", error);
        res.status(500).json({
            success: false,
            message: "Er ging iets fout bij het ophalen van beschikbaarheid"
        });
    }
}

async function createReservation(req, res) {
    try {
        const reservationData = {
            ...req.body,
            user_id: req.user.id
        }

        const reservation = await khelwaService.createReservation(reservationData)

        res.status(201).json({
            success: true,
            message: "Khelwa reservering is succesvol aangevraagd",
            data: reservation
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Reservering kon niet worden aangemaakt"
        })
    }
}

async function getMyReservations(req, res) {
    try {
        const reservations = await khelwaService.getReservationsByUser(req.user.id)

        res.json({
            success: true,
            data: reservations
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Kon jouw reserveringen niet ophalen"
        })
    }
}

async function getAllReservations(req, res) {
    try {
        const reservations = await khelwaService.getAllReservations();

        res.json({
            success: true,
            data: reservations
        });
    } catch (error) {
        console.error("getAllReservations error:", error);
        res.status(500).json({
            success: false,
            message: "Kon reserveringen niet ophalen"
        });
    }
}

async function approveReservation(req, res) {
    try {
        const { id } = req.params;
        const { admin_note } = req.body;

        const result = await khelwaService.approveReservation(id, admin_note);

        res.json({
            success: true,
            message: "Reservering goedgekeurd",
            data: result
        });
    } catch (error) {
        console.error("approveReservation error:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Reservering kon niet worden goedgekeurd"
        });
    }
}

async function rejectReservation(req, res) {
    try {
        const { id } = req.params;
        const { admin_note } = req.body;

        const result = await khelwaService.rejectReservation(id, admin_note);

        res.json({
            success: true,
            message: "Reservering afgekeurd",
            data: result
        });
    } catch (error) {
        console.error("rejectReservation error:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Reservering kon niet worden afgekeurd"
        });
    }
}

async function blockDate(req, res) {
    try {
        const { blocked_date, reason } = req.body;

        await khelwaService.blockDate(blocked_date, reason);

        res.status(201).json({
            success: true,
            message: "Datum is geblokkeerd"
        });
    } catch (error) {
        console.error("blockDate error:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Datum kon niet worden geblokkeerd"
        });
    }
}

module.exports = {
    getAvailability,
    createReservation,
    getMyReservations,
    getAllReservations,
    approveReservation,
    rejectReservation,
    blockDate
};