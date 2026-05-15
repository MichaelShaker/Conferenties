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

function getRegistrationEmailContent(registration) {
    const accepted = isAcceptedStatus(registration.registrationStatus);
    const rejected = isRejectedStatus(registration.registrationStatus);

    if (accepted) {
        return {
            subject: "Inschrijving goedgekeurd",
            label: "Goedgekeurd",
            labelColor: "#166534",
            labelBackground: "#dcfce7",
            title: "Je inschrijving is goedgekeurd",
            intro: `Je inschrijving voor ${escapeHtml(registration.eventTitle || "het event")} is goedgekeurd.`,
            detail: "We zien je graag daar."
        };
    }

    if (rejected) {
        return {
            subject: "Inschrijving afgewezen",
            label: "Afgewezen",
            labelColor: "#991b1b",
            labelBackground: "#fee2e2",
            title: "Je inschrijving is afgewezen",
            intro: `Helaas is je inschrijving voor ${escapeHtml(registration.eventTitle || "het event")} afgewezen.`,
            detail: "Neem contact op met de organisatie als je hierover vragen hebt."
        };
    }

    return {
        subject: "Update over je inschrijving",
        label: "In behandeling",
        labelColor: "#92400e",
        labelBackground: "#fef3c7",
        title: "Je inschrijving is in behandeling",
        intro: `Je inschrijving voor ${escapeHtml(registration.eventTitle || "het event")} is ontvangen.`,
        detail: "We controleren je inschrijving en betaling. Je ontvangt een bericht zodra je inschrijving is goedgekeurd of afgewezen."
    };
}

function buildRegistrationStatusEmail(registration) {
    const content = getRegistrationEmailContent(registration);
    const eventDate = registration.eventDate
        ? new Intl.DateTimeFormat("nl-NL", { dateStyle: "long" }).format(new Date(registration.eventDate))
        : null;

    const html = `
        <div style="margin: 0; padding: 32px 16px; background: #f8fafc; font-family: Arial, sans-serif; color: #0f172a;">
            <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden;">
                <div style="padding: 28px 32px; background: #2563eb; color: #ffffff;">
                    <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Conferenties</p>
                    <h1 style="margin: 0; font-size: 26px; line-height: 1.25;">${content.title}</h1>
                </div>
                <div style="padding: 32px;">
                    <span style="display: inline-block; padding: 8px 12px; border-radius: 999px; background: ${content.labelBackground}; color: ${content.labelColor}; font-size: 13px; font-weight: 700;">${content.label}</span>
                    <p style="margin: 24px 0 0; font-size: 16px; line-height: 1.6;">Beste ${escapeHtml(registration.userName || "gebruiker")},</p>
                    <p style="margin: 14px 0 0; font-size: 16px; line-height: 1.6;">${content.intro}</p>
                    <p style="margin: 14px 0 0; font-size: 16px; line-height: 1.6;">${content.detail}</p>
                    <div style="margin-top: 28px; padding: 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px;">
                        <p style="margin: 0; font-size: 13px; font-weight: 700; color: #64748b; letter-spacing: 0.08em; text-transform: uppercase;">Event</p>
                        <p style="margin: 8px 0 0; font-size: 18px; font-weight: 700;">${escapeHtml(registration.eventTitle || "Het event")}</p>
                        ${eventDate ? `<p style="margin: 8px 0 0; font-size: 15px; color: #475569;">${escapeHtml(eventDate)}</p>` : ""}
                        ${registration.eventLocation ? `<p style="margin: 6px 0 0; font-size: 15px; color: #475569;">${escapeHtml(registration.eventLocation)}</p>` : ""}
                    </div>
                    <p style="margin: 28px 0 0; font-size: 14px; line-height: 1.6; color: #64748b;">Met vriendelijke groet,<br />De organisatie</p>
                </div>
            </div>
        </div>
    `;

    return { subject: content.subject, html };
}

async function sendRegistrationStatusEmail({ registration, actorUserId, emailType }) {
    const { subject, html } = buildRegistrationStatusEmail(registration);

    await sendMail(registration.userEmail, subject, html);
    await logEmail({
        actorUserId,
        conferenceId: registration.eventId,
        registrationId: registration.id,
        emailType,
        recipientEmail: registration.userEmail,
        subject,
        status: "sent"
    });
}

async function logRegistrationStatusEmailFailure({ registration, actorUserId, emailType, subject, error }) {
    await logEmail({
        actorUserId,
        conferenceId: registration.eventId,
        registrationId: registration.id,
        emailType,
        recipientEmail: registration.userEmail,
        subject,
        status: "failed",
        errorMessage: error.message
    });
}

async function sendRegistrationResendEmail({ registration, actorUserId }) {
    const { subject } = buildRegistrationStatusEmail(registration);

    try {
        await sendRegistrationStatusEmail({
            registration,
            actorUserId,
            emailType: "registration_resend"
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
        await logRegistrationStatusEmailFailure({
            registration,
            actorUserId,
            emailType: "registration_resend",
            subject,
            error
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

            if (userEmail && didStatusChange(updatedRegistration)) {
                let emailType = "registration_pending";
                if (isAcceptedStatus(registrationStatus)) {
                    emailType = "registration_approved";
                } else if (isRejectedStatus(registrationStatus)) {
                    emailType = "registration_rejected";
                }

                await sendRegistrationStatusEmail({
                    registration: updatedRegistration,
                    actorUserId: req.user?.id,
                    emailType
                });
            }

        } catch (mailError) {
            console.error("Email error:", mailError.message);
            const { subject } = buildRegistrationStatusEmail(updatedRegistration);
            await logRegistrationStatusEmailFailure({
                registration: updatedRegistration,
                actorUserId: req.user?.id,
                emailType: "registration_status",
                subject,
                error: mailError
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

        setImmediate(() => {
            sendRegistrationResendEmail({
                registration,
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
