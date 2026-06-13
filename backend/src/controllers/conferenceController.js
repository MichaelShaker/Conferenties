const conferenceService = require("../services/conferenceService");
const { sendMail } = require("../services/mailService");
const googleSheetsService = require("../services/googleSheetsService");
const { escapeHtml } = require("../utils/html");
const { logAudit } = require("../services/auditService");
const { createUnsubscribeFooter } = require("../services/unsubscribeService");
const { logEmail } = require("../services/emailLogService");
const { sendError } = require("../utils/apiError");

function formatDisplayDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("nl-NL", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

function formatDisplayDateRange(startValue, endValue) {
    if (!endValue || String(startValue).slice(0, 10) === String(endValue).slice(0, 10)) {
        return formatDisplayDate(startValue);
    }

    return `${formatDisplayDate(startValue)} t/m ${formatDisplayDate(endValue)}`;
}

function buildEventEmailHtml(conference, user, body) {
    return `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a;">
            <h2>Nieuw evenement beschikbaar</h2>
            <p>Beste ${escapeHtml(user.name || "gebruiker")},</p>
            <p>${escapeHtml(body).replace(/\n/g, "<br>")}</p>
            <p><strong>${escapeHtml(conference.title)}</strong></p>
            <p>Locatie: ${escapeHtml(conference.location)}</p>
            <p>Datum: ${escapeHtml(formatDisplayDateRange(conference.date, conference.dateEnd))}</p>
            <p>Log in om de details te bekijken en je in te schrijven.</p>
            ${user.id && user.email ? createUnsubscribeFooter(user) : ""}
        </div>
    `;
}

function syncConferenceSheetInBackground(conferenceId) {
    setImmediate(() => {
        googleSheetsService.syncConferenceSheetQuietly(conferenceId).catch(error => {
            console.error("Unexpected Google Sheets background sync error:", error.message);
        });
    });
}

function sendEventCreatedEmailsInBackground(conference) {
    setImmediate(async () => {
        try {
            const users = await conferenceService.getUsersForConferenceNotification(conference);
            const subject = conference.emailSubject || `Nieuw evenement: ${conference.title}`;
            const body = conference.emailBody || "Er is een evenement toegevoegd dat bij jouw profiel past.";

            await Promise.allSettled(users.map(async user => {
                try {
                    await sendMail(user.email, subject, buildEventEmailHtml(conference, user, body));
                    await logEmail({
                        conferenceId: conference.id,
                        emailType: "event_created",
                        recipientEmail: user.email,
                        subject,
                        status: "sent"
                    });
                } catch (error) {
                    await logEmail({
                        conferenceId: conference.id,
                        emailType: "event_created",
                        recipientEmail: user.email,
                        subject,
                        status: "failed",
                        errorMessage: error.message
                    });
                    throw error;
                }
            }));
        } catch (mailError) {
            console.error("Event email error:", mailError.message);
        }
    });
}

async function getConferences(req, res) {
    try {
        const conferences = await conferenceService.getAllConferences();

        res.json({
            success: true,
            data: conferences
        });
    } catch (error) {
        console.error("Error fetching conferences:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not fetch conferences"
        });
    }
}

async function getConference(req, res) {
    try {
        const { id } = req.params;
        const conference = await conferenceService.getConferenceById(id);

        if (!conference) {
            return sendError(res, 404, "EVENT_NOT_FOUND", {
                message: "We konden dit event niet vinden.",
                description: "Het event is mogelijk verwijderd of de link klopt niet meer.",
                action: "Ga terug naar het eventoverzicht en kies het event opnieuw."
            });
        }

        res.json({
            success: true,
            data: conference
        });
    } catch (error) {
        console.error("Error fetching conference:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not fetch conference"
        });
    }
}

async function createConference(req, res) {
    try {
        const {
            title,
            category,
            location,
            date,
            dateEnd,
            description,
            image,
            price,
            maxEventDays,
            allowPartialDays,
            priceOneDay,
            priceTwoDays,
            priceThreeDays,
            capacity,

            eventType,
            city,
            churchId,
            minAge,
            maxAge,
            requiresChurch,
            requiresRank,
            requiresConfessionFather,
            requiresAllergies,
            targetChurchId,
            targetCity,
            targetRank,

            paymentLink,
            paymentQrUrl,
            paymentLinkOneDay,
            paymentLinkTwoDays,
            paymentLinkThreeDays,
            paymentQrUrlOneDay,
            paymentQrUrlTwoDays,
            paymentQrUrlThreeDays,
            paymentContactName,
            paymentContactPhone,
            paymentInstructions,
            registrationDeadline,
            emailSubject,
            emailBody
        } = req.body;

        if (!title || !category || !location || !date) {
            return sendError(res, 400, "EVENT_REQUIRED_FIELDS", {
                message: "Vul de verplichte eventgegevens in.",
                description: "Titel, categorie, locatie en startdatum zijn verplicht.",
                action: "Controleer het formulier en probeer opnieuw."
            });
        }

        if (dateEnd && new Date(dateEnd) < new Date(date)) {
            return sendError(res, 400, "EVENT_END_BEFORE_START", {
                message: "De einddatum kan niet vóór de startdatum liggen.",
                description: "Een event moet eindigen op of na de startdatum.",
                action: "Pas de einddatum aan en probeer opnieuw."
            });
        }

        const conference = await conferenceService.createConference({
            title,
            category,
            location,
            date,
            dateEnd: dateEnd || null,
            description: description || "",
            image: image || "",
            price: Number(price || 0),
            maxEventDays,
            allowPartialDays,
            priceOneDay,
            priceTwoDays,
            priceThreeDays,
            capacity: Number(capacity || 100),

            eventType: eventType || "national",
            city: city || null,
            churchId: churchId ? Number(churchId) : null,
            minAge: minAge ? Number(minAge) : null,
            maxAge: maxAge ? Number(maxAge) : null,
            requiresChurch: !!requiresChurch,
            requiresRank: !!requiresRank,
            requiresConfessionFather: !!requiresConfessionFather,
            requiresAllergies: !!requiresAllergies,
            targetChurchId: targetChurchId ? Number(targetChurchId) : null,
            targetCity: targetCity || null,
            targetRank: targetRank || null,

            paymentLink: paymentLink || null,
            paymentQrUrl: paymentQrUrl || null,
            paymentLinkOneDay,
            paymentLinkTwoDays,
            paymentLinkThreeDays,
            paymentQrUrlOneDay,
            paymentQrUrlTwoDays,
            paymentQrUrlThreeDays,
            paymentContactName: paymentContactName || null,
            paymentContactPhone: paymentContactPhone || null,
            paymentInstructions: paymentInstructions || null,
            registrationDeadline: registrationDeadline || null,
            emailSubject: emailSubject || null,
            emailBody: emailBody || null
        });

        sendEventCreatedEmailsInBackground(conference);

        await logAudit({
            actorUserId: req.user?.id,
            action: "conference.created",
            entityType: "conference",
            entityId: conference.id,
            details: { title: conference.title }
        });

        syncConferenceSheetInBackground(conference.id);

        res.status(201).json({
            success: true,
            message: "Conference created successfully",
            data: conference
        });
    } catch (error) {
        console.error("Error creating conference:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not create conference"
        });
    }
}

async function updateConference(req, res) {
    try {
        const { id } = req.params;
        const { date, dateEnd } = req.body;
        const existingConference = await conferenceService.getConferenceById(id);

        if (!existingConference) {
            return sendError(res, 404, "EVENT_NOT_FOUND", {
                message: "We konden dit event niet vinden.",
                description: "Het event is mogelijk verwijderd of de link klopt niet meer.",
                action: "Ga terug naar het eventoverzicht en kies het event opnieuw."
            });
        }

        if (date && dateEnd && new Date(dateEnd) < new Date(date)) {
            return sendError(res, 400, "EVENT_END_BEFORE_START", {
                message: "De einddatum kan niet vóór de startdatum liggen.",
                description: "Een event moet eindigen op of na de startdatum.",
                action: "Pas de einddatum aan en probeer opnieuw."
            });
        }

        const updatedConference = await conferenceService.updateConference(id, req.body);

        await logAudit({
            actorUserId: req.user?.id,
            action: "conference.updated",
            entityType: "conference",
            entityId: Number(id),
            details: { title: updatedConference.title }
        });

        syncConferenceSheetInBackground(id);

        res.json({
            success: true,
            message: "Conference updated successfully",
            data: updatedConference
        });
    } catch (error) {
        console.error("Error updating conference:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not update conference"
        });
    }
}

async function deleteConference(req, res) {
    try {
        const { id } = req.params;
        const deleted = await conferenceService.deleteConference(id);

        if (!deleted) {
            return sendError(res, 404, "EVENT_NOT_FOUND", {
                message: "We konden dit event niet vinden.",
                description: "Het event is mogelijk al verwijderd of gearchiveerd.",
                action: "Ververs het overzicht en probeer opnieuw."
            });
        }

        await logAudit({
            actorUserId: req.user?.id,
            action: "conference.archived",
            entityType: "conference",
            entityId: Number(id)
        });

        res.json({
            success: true,
            message: "Conference archived successfully"
        });
    } catch (error) {
        console.error("Error deleting conference:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not delete conference"
        });
    }
}

function escapeCsvValue(value) {
    if (value === null || value === undefined) return "";

    let stringValue = String(value);

    // Prevent Excel formula injection
    if (/^[=+\-@]/.test(stringValue)) {
        stringValue = "'" + stringValue;
    }

    return `"${stringValue.replace(/"/g, '""')}"`;
}

function formatCsvDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function isApprovedRegistration(user) {
    return user.paymentStatus === "paid"
        && ["confirmed", "approved", "goedgekeurd"].includes(user.registrationStatus);
}

function formatTransportOption(option) {
    if (option === "own_transport") return "Eigen vervoer";
    if (option === "bus") return "Bus tegen aanvullende kosten";

    return option || "";
}

function formatSelectedDays(selectedDays) {
    if (!selectedDays) return "Volledig event";

    return String(selectedDays)
        .split(",")
        .map(day => `Dag ${day.trim()}`)
        .join(", ");
}

async function exportApprovedUsersCsv(req, res) {
    try {
        const { id } = req.params;

        const conference = await conferenceService.getConferenceById(id);

        if (!conference) {
            return res.status(404).json({
                success: false,
                message: "Conference not found"
            });
        }

        const filter = req.query.filter || "all";
        const users = (await conferenceService.getApprovedUsersForConference(id))
            .filter(user => {
                if (filter === "approved") return isApprovedRegistration(user);
                if (filter === "pending_payment") return user.paymentStatus === "pending";
                if (filter === "proof_uploaded") return user.paymentStatus === "proof_uploaded";
                if (filter === "bus") return user.transportOption === "bus";
                if (filter === "shirts") return !!user.shirtSize;
                if (filter === "cancelled") return user.cancelledAt;
                return true;
            });

        const headers = [
            "Registratie ID",
            "Voornaam",
            "Achternaam",
            "Volledige naam",
            "E-mail",
            "Telefoon",
            "Shirtmaat",
            "Vervoer",
            "Gekozen dagen",
            "Prijs",
            "Geboortedatum",
            "Kerk",
            "Kerk stad",
            "Woonplaats",
            "Rang/functie",
            "Biechtvader",
            "Allergieën",
            "Dieet/notities",
            "Event",
            "Event datum",
            "Event locatie",
            "Betaalstatus",
            "Registratiestatus",
            "Admin notitie",
            "Geannuleerd op",
            "Op locatie lijst",
            "Betaalbewijs ontvangen",
            "Ingeschreven op"
        ];

        const rows = users.map(user => [
            user.registrationId,
            user.firstName,
            user.lastName,
            user.userName,
            user.userEmail,
            user.phone,
            user.shirtSize,
            formatTransportOption(user.transportOption),
            formatSelectedDays(user.selectedDays),
            user.selectedPrice,
            formatCsvDate(user.birthDate),
            user.churchName,
            user.churchCity,
            user.profileCity,
            user.rankTitle,
            user.confessionFather,
            user.allergies,
            user.dietaryNotes,
            user.eventTitle,
            formatCsvDate(user.eventDate),
            user.eventLocation,
            user.paymentStatus,
            user.registrationStatus,
            user.adminNote,
            formatCsvDate(user.cancelledAt),
            isApprovedRegistration(user) ? "Ja" : "Nee",
            formatCsvDate(user.paymentProofUploadedAt),
            formatCsvDate(user.registeredAt)
        ]);

        const csvContent = [
            headers.map(escapeCsvValue).join(","),
            ...rows.map(row => row.map(escapeCsvValue).join(","))
        ].join("\n");

        const safeTitle = conference.title
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase();

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="deelnemers_${safeTitle}.csv"`
        );

        res.send("\uFEFF" + csvContent);
    } catch (error) {
        console.error("CSV export error:", error);

        res.status(500).json({
            success: false,
            message: "Could not export approved users"
        });
    }
}

async function previewConferenceEmail(req, res) {
    try {
        const { id } = req.params;
        const conference = await conferenceService.getConferenceById(id);

        if (!conference) {
            return res.status(404).json({
                success: false,
                message: "Conference not found"
            });
        }

        const subject = conference.emailSubject || `Nieuw evenement: ${conference.title}`;
        const body = conference.emailBody || "Er is een evenement toegevoegd dat bij jouw profiel past.";

        res.json({
            success: true,
            data: {
                subject,
                html: buildEventEmailHtml(conference, { name: "gebruiker" }, body)
            }
        });
    } catch (error) {
        console.error("Email preview error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not preview email"
        });
    }
}

async function resendConferenceEmail(req, res) {
    try {
        const { id } = req.params;
        const conference = await conferenceService.getConferenceById(id);

        if (!conference) {
            return res.status(404).json({
                success: false,
                message: "Conference not found"
            });
        }

        const users = await conferenceService.getUsersForConferenceNotification(conference);
        const subject = conference.emailSubject || `Nieuw evenement: ${conference.title}`;
        const body = conference.emailBody || "Er is een evenement toegevoegd dat bij jouw profiel past.";

        const results = await Promise.allSettled(users.map(async user => {
            try {
                await sendMail(user.email, subject, buildEventEmailHtml(conference, user, body));
                await logEmail({
                    actorUserId: req.user?.id,
                    conferenceId: Number(id),
                    emailType: "event_resend",
                    recipientEmail: user.email,
                    subject,
                    status: "sent"
                });
            } catch (error) {
                await logEmail({
                    actorUserId: req.user?.id,
                    conferenceId: Number(id),
                    emailType: "event_resend",
                    recipientEmail: user.email,
                    subject,
                    status: "failed",
                    errorMessage: error.message
                });
                throw error;
            }
        }));

        const sentCount = results.filter(result => result.status === "fulfilled").length;

        await logAudit({
            actorUserId: req.user?.id,
            action: "conference.email_resent",
            entityType: "conference",
            entityId: Number(id),
            details: { sentCount, targetCount: users.length }
        });

        res.json({
            success: true,
            message: "Conference email resent",
            data: {
                sentCount,
                failedCount: users.length - sentCount
            }
        });
    } catch (error) {
        console.error("Email resend error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not resend event email"
        });
    }
}

async function sendConferenceTestEmail(req, res) {
    try {
        const { id } = req.params;
        const conference = await conferenceService.getConferenceById(id);

        if (!conference) {
            return res.status(404).json({
                success: false,
                message: "Conference not found"
            });
        }

        const userEmail = req.user?.email;

        if (!userEmail) {
            return res.status(400).json({
                success: false,
                message: "Your admin account has no email address"
            });
        }

        const subject = `[TEST] ${conference.emailSubject || `Nieuw evenement: ${conference.title}`}`;
        const body = conference.emailBody || "Er is een evenement toegevoegd dat bij jouw profiel past.";

        try {
            await sendMail(
                userEmail,
                subject,
                buildEventEmailHtml(conference, {
                    id: req.user.id,
                    name: req.user.name || "admin",
                    email: userEmail
                }, body)
            );
            await logEmail({
                actorUserId: req.user?.id,
                conferenceId: Number(id),
                emailType: "event_test",
                recipientEmail: userEmail,
                subject,
                status: "sent"
            });
        } catch (error) {
            await logEmail({
                actorUserId: req.user?.id,
                conferenceId: Number(id),
                emailType: "event_test",
                recipientEmail: userEmail,
                subject,
                status: "failed",
                errorMessage: error.message
            });
            throw error;
        }

        await logAudit({
            actorUserId: req.user?.id,
            action: "conference.test_email_sent",
            entityType: "conference",
            entityId: Number(id)
        });

        res.json({
            success: true,
            message: "Test email sent",
            data: { email: userEmail }
        });
    } catch (error) {
        console.error("Test email error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not send test email"
        });
    }
}

module.exports = {
    getConferences,
    getConference,
    createConference,
    updateConference,
    deleteConference,
    exportApprovedUsersCsv,
    previewConferenceEmail,
    resendConferenceEmail,
    sendConferenceTestEmail
};
