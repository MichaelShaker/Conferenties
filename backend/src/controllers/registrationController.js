const registrationService = require("../services/registrationService");
const { sendMail } = require("../services/mailService");
const googleSheetsService = require("../services/googleSheetsService");
const { escapeHtml } = require("../utils/html");
const { logAudit } = require("../services/auditService");
const { logEmail } = require("../services/emailLogService");

const MAX_PAYMENT_PROOF_LENGTH = 2_500_000;

function isValidPaymentProof(value) {
    return typeof value === "string"
        && value.length <= MAX_PAYMENT_PROOF_LENGTH
        && /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/i.test(value);
}

function isAcceptedStatus(status) {
    return ["confirmed", "approved", "goedgekeurd"].includes(status);
}

function isRejectedStatus(status) {
    return ["rejected", "denied", "afgewezen"].includes(status);
}

function didStatusChange(updatedRegistration) {
    return updatedRegistration.registrationStatus !== updatedRegistration.previousRegistrationStatus
        || updatedRegistration.paymentStatus !== updatedRegistration.previousPaymentStatus;
}

function buildRegistrationStatusEmail(registration, accepted) {
    const subject = accepted ? "Inschrijving goedgekeurd" : "Inschrijving afgewezen";
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a;">
            <h2>${accepted ? "Je inschrijving is goedgekeurd" : "Je inschrijving is afgewezen"}</h2>
            <p>Beste ${escapeHtml(registration.userName || "gebruiker")},</p>
            <p>${accepted ? "Je inschrijving voor" : "Helaas is je inschrijving voor"} <strong>${escapeHtml(registration.eventTitle || "het event")}</strong> ${accepted ? "is goedgekeurd." : "afgewezen."}</p>
        </div>
    `;

    return { subject, html };
}

async function sendRegistrationResendEmail({ registration, accepted, actorUserId }) {
    const { subject, html } = buildRegistrationStatusEmail(registration, accepted);

    try {
        await sendMail(registration.userEmail, subject, html);
        await logEmail({
            actorUserId,
            conferenceId: registration.eventId,
            registrationId: registration.id,
            emailType: "registration_resend",
            recipientEmail: registration.userEmail,
            subject,
            status: "sent"
        });
        await logAudit({
            actorUserId,
            action: "registration.email_resent",
            entityType: "registration",
            entityId: Number(registration.id),
            details: { registrationStatus: registration.registrationStatus, status: "sent" }
        });
    } catch (error) {
        console.error("Error resending registration email:", error.message);
        await logEmail({
            actorUserId,
            conferenceId: registration.eventId,
            registrationId: registration.id,
            emailType: "registration_resend",
            recipientEmail: registration.userEmail,
            subject,
            status: "failed",
            errorMessage: error.message
        });
        await logAudit({
            actorUserId,
            action: "registration.email_resend_failed",
            entityType: "registration",
            entityId: Number(registration.id),
            details: { registrationStatus: registration.registrationStatus, error: error.message }
        });
    }
}

async function registerForConference(req, res) {
    try {
        const userId = req.user.id;
        const { conferenceId, shirtSize, transportOption } = req.body;

        if (!conferenceId) {
            return res.status(400).json({
                success: false,
                message: "conferenceId is required"
            });
        }

        const result = await registrationService.createRegistration(userId, conferenceId, {
            shirtSize,
            transportOption
        });

        if (result.error) {
            return res.status(result.status).json({
                success: false,
                message: result.error
            });
        }

        await googleSheetsService.syncConferenceSheetQuietly(conferenceId);

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

        if (!isValidPaymentProof(paymentProof)) {
            return res.status(400).json({
                success: false,
                message: "Payment proof must be a PNG, JPG or WebP image under 2.5MB"
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

        await googleSheetsService.syncConferenceSheetQuietly(updatedRegistration.conferenceId);

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

async function getRegistrationPaymentProof(req, res) {
    try {
        const { id } = req.params;
        const proof = await registrationService.getRegistrationPaymentProof(id);

        if (!proof) {
            return res.status(404).json({
                success: false,
                message: "Registration not found"
            });
        }

        if (!proof.paymentProof) {
            return res.status(404).json({
                success: false,
                message: "Payment proof not found"
            });
        }

        res.json({
            success: true,
            data: proof
        });
    } catch (error) {
        console.error("Error fetching payment proof:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not fetch payment proof"
        });
    }
}

async function updateRegistration(req, res) {
    try {
        const { id } = req.params;
        const { paymentStatus, registrationStatus, adminNote } = req.body;

        if (!paymentStatus || !registrationStatus) {
            return res.status(400).json({
                success: false,
                message: "paymentStatus and registrationStatus are required"
            });
        }

        const updatedRegistration = await registrationService.updateRegistrationStatus(
            id,
            paymentStatus,
            registrationStatus,
            adminNote
        );

        if (!updatedRegistration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found"
            });
        }

        try {
            const userEmail = updatedRegistration.userEmail;
            const userName = updatedRegistration.userName || "gebruiker";
            const eventTitle = updatedRegistration.eventTitle || "het event";

            if (userEmail && didStatusChange(updatedRegistration) && isAcceptedStatus(registrationStatus)) {
                const subject = "Inschrijving goedgekeurd";
                await sendMail(
                    userEmail,
                    subject,
                    `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a;">
                        <h2>Je inschrijving is goedgekeurd</h2>
                        <p>Beste ${escapeHtml(userName)},</p>
                        <p>Je inschrijving voor <strong>${escapeHtml(eventTitle)}</strong> is goedgekeurd.</p>
                        <p>We zien je graag daar!</p>
                    </div>
                    `
                );
                await logEmail({
                    actorUserId: req.user?.id,
                    conferenceId: updatedRegistration.eventId,
                    registrationId: updatedRegistration.id,
                    emailType: "registration_approved",
                    recipientEmail: userEmail,
                    subject,
                    status: "sent"
                });
            }

            if (userEmail && didStatusChange(updatedRegistration) && isRejectedStatus(registrationStatus)) {
                const subject = "Inschrijving afgewezen";
                await sendMail(
                    userEmail,
                    subject,
                    `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a;">
                        <h2>Je inschrijving is afgewezen</h2>
                        <p>Beste ${escapeHtml(userName)},</p>
                        <p>Helaas is je inschrijving voor <strong>${escapeHtml(eventTitle)}</strong> afgewezen.</p>
                    </div>
                    `
                );
                await logEmail({
                    actorUserId: req.user?.id,
                    conferenceId: updatedRegistration.eventId,
                    registrationId: updatedRegistration.id,
                    emailType: "registration_rejected",
                    recipientEmail: userEmail,
                    subject,
                    status: "sent"
                });
            }

        } catch (mailError) {
            console.error("Email error:", mailError.message);
            await logEmail({
                actorUserId: req.user?.id,
                conferenceId: updatedRegistration.eventId,
                registrationId: updatedRegistration.id,
                emailType: "registration_status",
                recipientEmail: updatedRegistration.userEmail,
                subject: "Registratiestatus",
                status: "failed",
                errorMessage: mailError.message
            });
        }

        await googleSheetsService.syncConferenceSheetQuietly(updatedRegistration.eventId);
        await logAudit({
            actorUserId: req.user?.id,
            action: "registration.updated",
            entityType: "registration",
            entityId: Number(id),
            details: { paymentStatus, registrationStatus }
        });

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

async function cancelRegistration(req, res) {
    try {
        const { id } = req.params;
        const cancelledRegistration = await registrationService.cancelRegistration(id, req.user.id);

        if (!cancelledRegistration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found"
            });
        }

        await googleSheetsService.syncConferenceSheetQuietly(cancelledRegistration.conferenceId);
        await logAudit({
            actorUserId: req.user?.id,
            action: "registration.cancelled",
            entityType: "registration",
            entityId: Number(id)
        });

        res.json({
            success: true,
            message: "Registration cancelled",
            data: cancelledRegistration
        });
    } catch (error) {
        console.error("Error cancelling registration:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not cancel registration"
        });
    }
}

async function resendRegistrationEmail(req, res) {
    try {
        const { id } = req.params;
        const registration = await registrationService.getRegistrationById(id);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found"
            });
        }

        if (!registration.userEmail) {
            return res.status(400).json({
                success: false,
                message: "This user has no email address"
            });
        }

        const accepted = isAcceptedStatus(registration.registrationStatus);
        const rejected = isRejectedStatus(registration.registrationStatus);

        if (!accepted && !rejected) {
            return res.status(400).json({
                success: false,
                message: "Only accepted or rejected registration emails can be resent"
            });
        }

        setImmediate(() => {
            sendRegistrationResendEmail({
                registration,
                accepted,
                actorUserId: req.user?.id
            }).catch(error => {
                console.error("Unexpected resend email worker error:", error.message);
            });
        });

        res.json({
            success: true,
            message: "Registration email resend queued"
        });
    } catch (error) {
        console.error("Error resending registration email:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not resend registration email"
        });
    }
}

module.exports = {
    registerForConference,
    getMyRegistrations,
    getAllRegistrations,
    getRegistrationPaymentProof,
    updateRegistration,
    uploadPaymentProof,
    cancelRegistration,
    resendRegistrationEmail
};
