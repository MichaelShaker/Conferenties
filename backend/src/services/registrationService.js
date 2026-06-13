const pool = require("../config/db");

async function createRegistration(userId, conferenceId, registrationDetails = {}) {
    const { shirtSize, transportOption, selectedDays } = registrationDetails;

    const [userRows] = await pool.query(`
        SELECT id
        FROM users
        WHERE id = ?
    `, [userId]);

    if (userRows.length === 0) {
        return {
            error: "We konden je account niet vinden.",
            status: 401,
            code: "REGISTRATION_ACCOUNT_NOT_FOUND",
            description: "Je login verwijst naar een account dat niet meer bestaat.",
            action: "Log uit, log opnieuw in en probeer het daarna nog een keer."
        };
    }

    const [conferenceRows] = await pool.query(`
        SELECT
            id,
            title,
            capacity,
            registration_deadline AS registrationDeadline,
            COALESCE(max_event_days, 1) AS maxEventDays,
            COALESCE(allow_partial_days, 0) AS allowPartialDays,
            COALESCE(price_1_day, price) AS priceOneDay,
            price_2_days AS priceTwoDays,
            price_3_days AS priceThreeDays
        FROM conferences
        WHERE id = ?
    `, [conferenceId]);

    const conference = conferenceRows[0];

    if (!conference) {
        return {
            error: "We konden dit event niet vinden.",
            status: 404,
            code: "EVENT_NOT_FOUND",
            description: "Het event is mogelijk verwijderd of de link klopt niet meer.",
            action: "Ga terug naar het eventoverzicht en kies het event opnieuw."
        };
    }

    if (conference.registrationDeadline) {
        const deadline = new Date(conference.registrationDeadline);
        deadline.setHours(23, 59, 59, 999);

        if (new Date() > deadline) {
            return {
                error: "De inschrijfdeadline is voorbij.",
                status: 400,
                code: "REGISTRATION_DEADLINE_PASSED",
                description: "Voor dit event kun je je niet meer aanmelden via de website.",
                action: "Neem contact op met de organisatie als je denkt dat dit niet klopt."
            };
        }
    }

    const [existingRows] = await pool.query(`
        SELECT id
        FROM registrations
        WHERE user_id = ? AND conference_id = ?
    `, [userId, conferenceId]);

    if (existingRows.length > 0) {
        return {
            error: "Je bent al ingeschreven voor dit event.",
            status: 409,
            code: "REGISTRATION_ALREADY_EXISTS",
            description: "Er staat al een aanmelding voor jouw account bij dit event.",
            action: "Bekijk je inschrijving bij Mijn registraties."
        };
    }

    const [countRows] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM registrations
        WHERE conference_id = ?
          AND cancelled_at IS NULL
          AND registration_status <> 'rejected'
    `, [conferenceId]);

    if (countRows[0].total >= conference.capacity) {
        return {
            error: "Dit event zit vol.",
            status: 400,
            code: "REGISTRATION_EVENT_FULL",
            description: "Er zijn geen beschikbare plekken meer voor dit event.",
            action: "Kies eventueel een ander event of neem contact op met de organisatie."
        };
    }

    const normalizedSelectedDays = conference.allowPartialDays
        ? normalizeSelectedDays(selectedDays, conference.maxEventDays)
        : getAllEventDays(conference.maxEventDays);

    if (normalizedSelectedDays.length === 0) {
        return {
            error: "Kies minimaal één dag waarop je aanwezig bent.",
            status: 400,
            code: "REGISTRATION_DAYS_REQUIRED",
            description: "Voor dit event moet je aangeven op welke dag of dagen je komt.",
            action: "Vink één of meer dagen aan en probeer opnieuw."
        };
    }

    const selectedDayCount = normalizedSelectedDays.length;
    const selectedPrice = getPriceForDayCount(conference, selectedDayCount);

    const [result] = await pool.query(`
        INSERT INTO registrations (
            user_id, conference_id, shirt_size, transport_option,
            selected_days, selected_day_count, selected_price
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
        userId,
        conferenceId,
        shirtSize || null,
        transportOption || null,
        normalizedSelectedDays.join(","),
        selectedDayCount,
        selectedPrice
    ]);

    return { id: result.insertId };
}

function normalizeSelectedDays(selectedDays, maxEventDays = 1) {
    const maxDays = Math.min(3, Math.max(1, Number(maxEventDays || 1)));
    const values = Array.isArray(selectedDays) ? selectedDays : [];

    return [...new Set(values
        .map(value => Number(value))
        .filter(value => Number.isInteger(value) && value >= 1 && value <= maxDays))]
        .sort((a, b) => a - b);
}

function getAllEventDays(maxEventDays = 1) {
    const maxDays = Math.min(3, Math.max(1, Number(maxEventDays || 1)));

    return Array.from({ length: maxDays }, (_, index) => index + 1);
}

function getPriceForDayCount(conference, dayCount) {
    if (dayCount === 3 && conference.priceThreeDays !== null && conference.priceThreeDays !== undefined) {
        return Number(conference.priceThreeDays);
    }

    if (dayCount === 2 && conference.priceTwoDays !== null && conference.priceTwoDays !== undefined) {
        return Number(conference.priceTwoDays);
    }

    return Number(conference.priceOneDay || 0) * dayCount;
}

async function getMyRegistrations(userId) {
    const [rows] = await pool.query(`
        SELECT
            r.id,
            r.payment_status AS paymentStatus,
            r.payment_method AS paymentMethod,
            r.registration_status AS registrationStatus,
            r.shirt_size AS shirtSize,
            r.transport_option AS transportOption,
            r.selected_days AS selectedDays,
            COALESCE(r.selected_day_count, 1) AS selectedDayCount,
            COALESCE(r.selected_price, c.price) AS selectedPrice,
            r.admin_note AS adminNote,
            r.cancelled_at AS cancelledAt,
            r.created_at,
            c.id AS eventId,
            c.title AS eventTitle,
            c.category,
            c.location AS eventLocation,
            c.conference_date AS eventDate,
            c.event_end_date AS eventDateEnd,
            c.price,
            c.registration_deadline AS registrationDeadline,
            c.image_url AS eventImage
        FROM registrations r
                 INNER JOIN conferences c ON r.conference_id = c.id
        WHERE r.user_id = ?
        ORDER BY c.conference_date ASC
    `, [userId]);

    return rows;
}

async function getAllRegistrations() {
    const [rows] = await pool.query(`
        SELECT
            r.id,
            r.payment_status AS paymentStatus,
            r.payment_method AS paymentMethod,
            r.registration_status AS registrationStatus,
            r.shirt_size AS shirtSize,
            r.transport_option AS transportOption,
            r.selected_days AS selectedDays,
            COALESCE(r.selected_day_count, 1) AS selectedDayCount,
            COALESCE(r.selected_price, c.price) AS selectedPrice,
            r.admin_note AS adminNote,
            r.cancelled_at AS cancelledAt,
            r.created_at,
            r.payment_proof IS NOT NULL AS hasPaymentProof,
            r.payment_proof_uploaded_at AS paymentProofUploadedAt,
            u.id AS userId,
            u.name AS userName,
            u.email AS userEmail,
            up.phone AS userPhone,
            up.first_name AS firstName,
            up.last_name AS lastName,
            up.city AS profileCity,
            up.rank_title AS rankTitle,
            ch.name AS churchName,
            ch.city AS churchCity,
            c.id AS eventId,
            c.title AS eventTitle,
            c.location AS eventLocation,
            c.conference_date AS eventDate,
            c.event_end_date AS eventDateEnd,
            c.google_sheet_url AS googleSheetUrl,
            c.google_sheet_last_synced_at AS googleSheetLastSyncedAt,
            c.google_sheet_last_error AS googleSheetLastError
        FROM registrations r
                 INNER JOIN users u ON r.user_id = u.id
                 INNER JOIN conferences c ON r.conference_id = c.id
                 LEFT JOIN user_profiles up ON up.user_id = u.id
                 LEFT JOIN churches ch ON ch.id = up.church_id
        ORDER BY r.created_at DESC
    `);

    return rows;
}

async function getRegistrationPaymentProof(id) {
    const [rows] = await pool.query(`
        SELECT
            id,
            payment_proof AS paymentProof,
            payment_proof_uploaded_at AS paymentProofUploadedAt
        FROM registrations
        WHERE id = ?
    `, [id]);

    return rows[0] || null;
}

async function updateRegistrationStatus(id, paymentStatus, registrationStatus, adminNote, paymentMethod = null) {
    const [existingRows] = await pool.query(`
        SELECT payment_status AS paymentStatus, registration_status AS registrationStatus
        FROM registrations
        WHERE id = ?
    `, [id]);

    const existingRegistration = existingRows[0] || null;

    await pool.query(`
        UPDATE registrations
        SET
            payment_status = ?,
            registration_status = ?,
            payment_method = ?,
            admin_note = ?,
            approved_at = CASE
                WHEN ? IN ('confirmed', 'approved', 'goedgekeurd') THEN COALESCE(approved_at, NOW())
                ELSE approved_at
            END
        WHERE id = ?
    `, [paymentStatus, registrationStatus, paymentMethod || null, adminNote || null, registrationStatus, id]);

    const [rows] = await pool.query(`
        SELECT
            r.id,
            r.payment_status AS paymentStatus,
            r.payment_method AS paymentMethod,
            r.registration_status AS registrationStatus,
            ? AS previousPaymentStatus,
            ? AS previousRegistrationStatus,
            r.shirt_size AS shirtSize,
            r.transport_option AS transportOption,
            r.admin_note AS adminNote,
            r.cancelled_at AS cancelledAt,
            r.created_at,
            r.payment_proof AS paymentProof,
            r.payment_proof_uploaded_at AS paymentProofUploadedAt,

            u.id AS userId,
            u.name AS userName,
            u.email AS userEmail,

            c.id AS eventId,
            c.title AS eventTitle,
            c.location AS eventLocation,
            c.conference_date AS eventDate,
            c.event_end_date AS eventDateEnd
        FROM registrations r
                 INNER JOIN users u ON r.user_id = u.id
                 INNER JOIN conferences c ON r.conference_id = c.id
        WHERE r.id = ?
    `, [
        existingRegistration?.paymentStatus || null,
        existingRegistration?.registrationStatus || null,
        id
    ]);

    return rows[0];
}

async function cancelRegistration(id, userId) {
    await pool.query(`
        UPDATE registrations
        SET
            registration_status = 'cancelled',
            cancelled_at = NOW()
        WHERE id = ?
          AND user_id = ?
          AND cancelled_at IS NULL
    `, [id, userId]);

    const [rows] = await pool.query(`
        SELECT
            r.id,
            r.conference_id AS conferenceId,
            r.payment_status AS paymentStatus,
            r.registration_status AS registrationStatus,
            r.cancelled_at AS cancelledAt
        FROM registrations r
        WHERE r.id = ? AND r.user_id = ?
    `, [id, userId]);

    return rows[0];
}

async function getRegistrationById(id) {
    const [rows] = await pool.query(`
        SELECT
            r.id,
            r.payment_status AS paymentStatus,
            r.payment_method AS paymentMethod,
            r.registration_status AS registrationStatus,
            r.admin_note AS adminNote,
            r.cancelled_at AS cancelledAt,
            u.id AS userId,
            u.name AS userName,
            u.email AS userEmail,
            c.id AS eventId,
            c.title AS eventTitle,
            c.location AS eventLocation,
            c.conference_date AS eventDate,
            c.event_end_date AS eventDateEnd
        FROM registrations r
                 INNER JOIN users u ON r.user_id = u.id
                 INNER JOIN conferences c ON r.conference_id = c.id
        WHERE r.id = ?
    `, [id]);

    return rows[0] || null;
}

async function uploadPaymentProof(id, userId, paymentProof) {
    await pool.query(`
        UPDATE registrations
        SET 
            payment_proof = ?,
            payment_proof_uploaded_at = NOW(),
            payment_status = 'proof_uploaded',
            payment_method = COALESCE(payment_method, 'tikkie')
        WHERE id = ? AND user_id = ?
    `, [paymentProof, id, userId]);

    const [rows] = await pool.query(`
        SELECT
            id,
            conference_id AS conferenceId,
            payment_status AS paymentStatus,
            payment_method AS paymentMethod,
            registration_status AS registrationStatus,
            payment_proof AS paymentProof,
            payment_proof_uploaded_at AS paymentProofUploadedAt
        FROM registrations
        WHERE id = ? AND user_id = ?
    `, [id, userId]);

    return rows[0];
}

module.exports = {
    createRegistration,
    getMyRegistrations,
    getAllRegistrations,
    updateRegistrationStatus,
    uploadPaymentProof,
    cancelRegistration,
    getRegistrationById,
    getRegistrationPaymentProof
};
