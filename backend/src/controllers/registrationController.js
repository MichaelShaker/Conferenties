const registrationService = require("../services/registrationService");
const { sendMail } = require("../services/mailService");

async function registerForConference(req, res) {
    try {
        const userId = req.user.id;
        const { conferenceId } = req.body;

        if (!conferenceId) {
            return res.status(400).json({
                success: false,
                message: "conferenceId is required"
            });
        }

        const result = await registrationService.createRegistration(userId, conferenceId);

        if (result.error) {
            return res.status(result.status).json({
                success: false,
                message: result.error
            });
        }

        res.status(201).json({
            success: true,
            message: "Registration created successfully",
            data: result
        });
    } catch (error) {
        console.error("Error creating registration:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not create registration"
        });
    }
}

async function uploadPaymentProof(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { paymentProof } = req.body;

        if (!paymentProof) {
            return res.status(400).json({
                success: false,
                message: "Payment proof is required"
            });
        }

        const updatedRegistration = await registrationService.uploadPaymentProof(
            id,
            userId,
            paymentProof
        );

        if (!updatedRegistration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found"
            });
        }

        res.json({
            success: true,
            message: "Payment proof uploaded successfully",
            data: updatedRegistration
        });
    } catch (error) {
        console.error("Error uploading payment proof:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not upload payment proof"
        });
    }
}

async function getMyRegistrations(req, res) {
    try {
        const userId = req.user.id;
        const registrations = await registrationService.getMyRegistrations(userId);

        res.json({
            success: true,
            data: registrations
        });
    } catch (error) {
        console.error("Error fetching my registrations:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not fetch registrations"
        });
    }
}

async function getAllRegistrations(req, res) {
    try {
        const registrations = await registrationService.getAllRegistrations();

        res.json({
            success: true,
            data: registrations
        });
    } catch (error) {
        console.error("Error fetching all registrations:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not fetch registrations"
        });
    }
}

async function updateRegistration(req, res) {
    try {
        const { id } = req.params;
        const { paymentStatus, registrationStatus } = req.body;

        if (!paymentStatus || !registrationStatus) {
            return res.status(400).json({
                success: false,
                message: "paymentStatus and registrationStatus are required"
            });
        }

        const updatedRegistration = await registrationService.updateRegistrationStatus(
            id,
            paymentStatus,
            registrationStatus
        );

        // 🔥 SEND EMAIL HERE
        try {
            const userEmail = updatedRegistration.userEmail;
            const userName = updatedRegistration.userName || "gebruiker";

            if (registrationStatus === "approved" || registrationStatus === "goedgekeurd") {
                await sendMail(
                    userEmail,
                    "Inschrijving goedgekeurd",
                    `
        <div style="font-family: Arial; padding: 20px;">
            <h2>Je inschrijving is goedgekeurd</h2>
            <p>Beste ${userName},</p>
            <p>Je inschrijving voor <strong>${updatedRegistration.eventTitle}</strong> is goedgekeurd.</p>
            <p>We zien je graag daar!</p>
        </div>
        `
                );
            }

            if (registrationStatus === "denied" || registrationStatus === "afgewezen") {
                await sendMail(
                    userEmail,
                    "Inschrijving afgewezen",
                    `
        <div style="font-family: Arial; padding: 20px;">
            <h2>Je inschrijving is afgewezen</h2>
            <p>Beste ${userName},</p>
            <p>Helaas is je inschrijving voor <strong>${updatedRegistration.eventTitle}</strong> afgewezen.</p>
        </div>
        `
                );
            }

            if (registrationStatus === "denied" || registrationStatus === "afgewezen") {
                await sendMail(
                    userEmail,
                    "Inschrijving afgewezen",
                    `
                    <h2>Je inschrijving is afgewezen</h2>
                    <p>Beste ${userName},</p>
                    <p>Helaas is je inschrijving afgewezen.</p>
                    `
                );
            }

        } catch (mailError) {
            console.error("Email error:", mailError.message);
        }

        res.json({
            success: true,
            message: "Registration updated successfully",
            data: updatedRegistration
        });
    } catch (error) {
        console.error("Error updating registration:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not update registration"
        });
    }
}

module.exports = {
    registerForConference,
    getMyRegistrations,
    getAllRegistrations,
    updateRegistration,
    uploadPaymentProof
};