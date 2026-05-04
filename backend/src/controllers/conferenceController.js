const conferenceService = require("../services/conferenceService");
const { sendMail } = require("../services/mailService");

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
            return res.status(404).json({
                success: false,
                message: "Conference not found"
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
            description,
            image,
            price,
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
            paymentContactName,
            paymentContactPhone,
            paymentInstructions
        } = req.body;

        if (!title || !category || !location || !date) {
            return res.status(400).json({
                success: false,
                message: "Title, category, location and date are required"
            });
        }

        const conference = await conferenceService.createConference({
            title,
            category,
            location,
            date,
            description: description || "",
            image: image || "",
            price: Number(price || 0),
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
            paymentContactName: paymentContactName || null,
            paymentContactPhone: paymentContactPhone || null,
            paymentInstructions: paymentInstructions || null
        });

        try {
            const users = await conferenceService.getUsersForConferenceNotification(conference);

            await Promise.all(
                users.map(user =>
                    sendMail(
                        user.email,
                        `Nieuw evenement: ${conference.title}`,
                        `
            <div style="font-family: Arial; padding: 20px;">
                <h2>Nieuw evenement toegevoegd</h2>
                <p>Beste ${user.name || "gebruiker"},</p>

                <p>Er is een nieuw evenement beschikbaar:</p>

                <p><strong>${conference.title}</strong></p>
                <p>📍 ${conference.location}</p>
                <p>📅 ${conference.date}</p>

                <p>Log in om je in te schrijven.</p>
            </div>
            `
                    )
                )
            );
        } catch (mailError) {
            console.error("Event email error:", mailError.message);
        }

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
        const existingConference = await conferenceService.getConferenceById(id);

        if (!existingConference) {
            return res.status(404).json({
                success: false,
                message: "Conference not found"
            });
        }

        const updatedConference = await conferenceService.updateConference(id, req.body);

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
            return res.status(404).json({
                success: false,
                message: "Conference not found"
            });
        }

        res.json({
            success: true,
            message: "Conference deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting conference:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not delete conference"
        });
    }
}

module.exports = {
    getConferences,
    getConference,
    createConference,
    updateConference,
    deleteConference
};