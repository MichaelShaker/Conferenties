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

function syncConferenceSheetInBackground(conferenceId) {
    setImmediate(() => {
        googleSheetsService.syncConferenceSheetQuietly(conferenceId).catch(error => {
            console.error("Unexpected Google Sheets background sync error:", error.message);
        });
    });
}

function getRegistrationEmailContent(registration) {
    const accepted = isAcceptedStatus(registration.registrationStatus);
    const rejected = isRejectedStatus(registration.registrationStatus);

    if (accepted) {
        return {
            subject: "Update: je inschrijving is goedgekeurd",
            label: "Goedgekeurd",
            labelColor: "#166534",
            labelBackground: "#dcfce7",
            eyebrow: "Goed nieuws",
            title: "Je bent erbij",
            intro: "Je inschrijving is goedgekeurd. We hebben je plek bevestigd en kijken ernaar uit je te zien.",
            detail: "Bewaar deze mail als bevestiging van je inschrijving. Als er later nog praktische informatie is, ontvang je die apart.",
            stepsTitle: "Wat kun je nu doen?",
            steps: [
                "Controleer de datum, locatie en eventuele betaalinformatie hieronder.",
                "Zet het event alvast in je agenda.",
                "Laat het ons weten als je toch niet kunt komen, zodat we je plek kunnen vrijmaken."
            ]
        };
    }

    if (rejected) {
        return {
            subject: "Update: je inschrijving is afgewezen",
            label: "Afgewezen",
            labelColor: "#991b1b",
            labelBackground: "#fee2e2",
            eyebrow: "Update over je aanvraag",
            title: "Je inschrijving is afgewezen",
            intro: "Helaas kunnen we je inschrijving op dit moment niet goedkeuren.",
            detail: "Dat kan bijvoorbeeld komen door beschikbare plekken, voorwaarden voor het event of de status van je betaling. Neem gerust contact op met de organisatie als je vragen hebt.",
            stepsTitle: "Wat betekent dit?",
            steps: [
                "Je staat op dit moment niet op de deelnemerslijst voor dit event.",
                "Als er iets niet klopt, kun je contact opnemen met de organisatie.",
                "Je account blijft gewoon actief voor toekomstige events."
            ]
        };
    }

    return {
        subject: "Update: je inschrijving is in behandeling",
        label: "In behandeling",
        labelColor: "#92400e",
        labelBackground: "#fef3c7",
        eyebrow: "We hebben je aanvraag ontvangen",
        title: "Je inschrijving is in behandeling",
        intro: "Je inschrijving is ontvangen en staat klaar om gecontroleerd te worden.",
        detail: "We controleren je gegevens en betaling. Zodra je inschrijving is goedgekeurd of afgewezen, ontvang je automatisch een nieuwe update.",
        stepsTitle: "Wat gebeurt er nu?",
        steps: [
            "Als betaling nodig is, zorg dan dat je betaling of betaalbewijs compleet is.",
            "De organisatie controleert je inschrijving zo snel mogelijk.",
            "Je hoeft je niet opnieuw in te schrijven zolang deze aanvraag zichtbaar is in je account."
        ]
    };
}

function buildRegistrationStatusEmail(registration) {
    const content = getRegistrationEmailContent(registration);
    const eventDate = registration.eventDate
        ? new Intl.DateTimeFormat("nl-NL", { dateStyle: "long" }).format(new Date(registration.eventDate))
        : null;
    const paymentStatusLabels = {
        pending: "Wacht op betaling",
        proof_uploaded: "Betaalbewijs geupload",
        paid: "Betaald",
        rejected: "Afgewezen"
    };
    const registrationStatusLabels = {
        pending: "In behandeling",
        confirmed: "Bevestigd",
        approved: "Goedgekeurd",
        goedgekeurd: "Goedgekeurd",
        rejected: "Afgewezen",
        denied: "Afgewezen",
        afgewezen: "Afgewezen"
    };
    const paymentStatus = paymentStatusLabels[registration.paymentStatus] || registration.paymentStatus || "Onbekend";
    const registrationStatus = registrationStatusLabels[registration.registrationStatus] || registration.registrationStatus || "Onbekend";
    const stepsHtml = content.steps.map(step => `
        <tr>
            <td style="padding: 0 0 10px; vertical-align: top; width: 22px; color: #2563eb; font-weight: 700;">-</td>
            <td style="padding: 0 0 10px; font-size: 15px; line-height: 1.6; color: #334155;">${escapeHtml(step)}</td>
        </tr>
    `).join("");

    const html = `
        <div style="margin: 0; padding: 34px 16px; background: #eef2f7; font-family: Arial, sans-serif; color: #0f172a;">
            <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #dbe3ee; border-radius: 18px; overflow: hidden;">
                <div style="padding: 30px 34px; background: #1d4ed8; color: #ffffff;">
                    <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">${escapeHtml(content.eyebrow)}</p>
                    <h1 style="margin: 0; font-size: 28px; line-height: 1.25;">${escapeHtml(content.title)}</h1>
                    <p style="margin: 12px 0 0; font-size: 16px; line-height: 1.55; color: #dbeafe;">${escapeHtml(registration.eventTitle || "Het event")}</p>
                </div>
                <div style="padding: 34px;">
                    <span style="display: inline-block; padding: 8px 12px; border-radius: 999px; background: ${content.labelBackground}; color: ${content.labelColor}; font-size: 13px; font-weight: 700;">${content.label}</span>
                    <p style="margin: 24px 0 0; font-size: 16px; line-height: 1.6;">Beste ${escapeHtml(registration.userName || "gebruiker")},</p>
                    <p style="margin: 14px 0 0; font-size: 16px; line-height: 1.65;">${escapeHtml(content.intro)}</p>
                    <p style="margin: 14px 0 0; font-size: 16px; line-height: 1.65;">${escapeHtml(content.detail)}</p>

                    <div style="margin-top: 28px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px;">
                        <p style="margin: 0; font-size: 13px; font-weight: 700; color: #64748b; letter-spacing: 0.08em; text-transform: uppercase;">Event</p>
                        <p style="margin: 8px 0 0; font-size: 18px; font-weight: 700;">${escapeHtml(registration.eventTitle || "Het event")}</p>
                        ${eventDate ? `<p style="margin: 8px 0 0; font-size: 15px; color: #475569;">${escapeHtml(eventDate)}</p>` : ""}
                        ${registration.eventLocation ? `<p style="margin: 6px 0 0; font-size: 15px; color: #475569;">${escapeHtml(registration.eventLocation)}</p>` : ""}
                    </div>

                    <div style="margin-top: 18px; padding: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px;">
                        <p style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #64748b; letter-spacing: 0.08em; text-transform: uppercase;">Status</p>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Inschrijving</td>
                                <td style="padding: 8px 0; font-size: 14px; color: #0f172a; font-weight: 700; text-align: right;">${escapeHtml(registrationStatus)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0;">Betaling</td>
                                <td style="padding: 8px 0; font-size: 14px; color: #0f172a; font-weight: 700; text-align: right; border-top: 1px solid #e2e8f0;">${escapeHtml(paymentStatus)}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="margin-top: 24px;">
                        <h2 style="margin: 0 0 12px; font-size: 18px; line-height: 1.35;">${escapeHtml(content.stepsTitle)}</h2>
                        <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                            ${stepsHtml}
                        </table>
                    </div>

                    <p style="margin: 26px 0 0; padding-top: 22px; border-top: 1px solid #e2e8f0; font-size: 14px; line-height: 1.6; color: #64748b;">Met vriendelijke groet,<br />De organisatie</p>
                </div>
            </div>
        </div>
    `;

    return { subject: content.subject, html };
}

function buildCustomRegistrationEmail(registration, body) {
    return `
        <div style="margin: 0; padding: 34px 16px; background: #eef2f7; font-family: Arial, sans-serif; color: #0f172a;">
            <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #dbe3ee; border-radius: 18px; overflow: hidden;">
                <div style="padding: 30px 34px; background: #1d4ed8; color: #ffffff;">
                    <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">Bericht van de organisatie</p>
                    <h1 style="margin: 0; font-size: 27px; line-height: 1.25;">Aanvullende informatie nodig</h1>
                    <p style="margin: 12px 0 0; font-size: 16px; line-height: 1.55; color: #dbeafe;">${escapeHtml(registration.eventTitle || "Het event")}</p>
                </div>
                <div style="padding: 34px;">
                    <p style="margin: 0; font-size: 16px; line-height: 1.6;">Beste ${escapeHtml(registration.userName || "gebruiker")},</p>
                    <div style="margin-top: 18px; font-size: 16px; line-height: 1.7; color: #334155;">
                        ${escapeHtml(body).replace(/\n/g, "<br>")}
                    </div>
                    <div style="margin-top: 28px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px;">
                        <p style="margin: 0; font-size: 13px; font-weight: 700; color: #64748b; letter-spacing: 0.08em; text-transform: uppercase;">Over deze inschrijving</p>
                        <p style="margin: 8px 0 0; font-size: 18px; font-weight: 700;">${escapeHtml(registration.eventTitle || "Het event")}</p>
                        ${registration.eventLocation ? `<p style="margin: 6px 0 0; font-size: 15px; color: #475569;">${escapeHtml(registration.eventLocation)}</p>` : ""}
                    </div>
                    <p style="margin: 26px 0 0; padding-top: 22px; border-top: 1px solid #e2e8f0; font-size: 14px; line-height: 1.6; color: #64748b;">Met vriendelijke groet,<br />De organisatie</p>
                </div>
            </div>
        </div>
    `;
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

async function sendCustomRegistrationEmailInBackground({ registration, actorUserId, subject, body }) {
    setImmediate(async () => {
        try {
            const html = buildCustomRegistrationEmail(registration, body);
            await sendMail(registration.userEmail, subject, html);
            await logEmail({
                actorUserId,
                conferenceId: registration.eventId,
                registrationId: registration.id,
                emailType: "registration_custom",
                recipientEmail: registration.userEmail,
                subject,
                status: "sent"
            });
            await logAudit({
                actorUserId,
                action: "registration.custom_email_sent",
                entityType: "registration",
                entityId: Number(registration.id),
                details: { subject }
            });
        } catch (error) {
            console.error("Error sending custom registration email:", error.message);
            await logEmail({
                actorUserId,
                conferenceId: registration.eventId,
                registrationId: registration.id,
                emailType: "registration_custom",
                recipientEmail: registration.userEmail,
                subject,
                status: "failed",
                errorMessage: error.message
            });
        }
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

        syncConferenceSheetInBackground(conferenceId);

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

        syncConferenceSheetInBackground(updatedRegistration.conferenceId);

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

        syncConferenceSheetInBackground(updatedRegistration.eventId);
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

        syncConferenceSheetInBackground(cancelledRegistration.conferenceId);
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

async function sendCustomRegistrationEmail(req, res) {
    try {
        const { id } = req.params;
        const { subject, body } = req.body;

        if (!subject || !body) {
            return res.status(400).json({
                success: false,
                message: "Subject and message are required"
            });
        }

        if (String(subject).length > 160 || String(body).length > 5000) {
            return res.status(400).json({
                success: false,
                message: "Subject or message is too long"
            });
        }

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

        sendCustomRegistrationEmailInBackground({
            registration,
            actorUserId: req.user?.id,
            subject: String(subject).trim(),
            body: String(body).trim()
        });

        res.json({
            success: true,
            message: "Custom registration email queued"
        });
    } catch (error) {
        console.error("Error queueing custom registration email:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not send registration email"
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
    resendRegistrationEmail,
    sendCustomRegistrationEmail
};
