const pool = require("../config/db");

function optionalNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    return Number(value);
}

function booleanValue(value, fallback = false) {
    if (value === "" || value === null || value === undefined) return fallback;
    return value === true || value === 1 || value === "1" || value === "true";
}

async function getAllConferences() {
    const [rows] = await pool.query(`
        SELECT
            c.id, c.title, c.category, c.location, c.conference_date AS date,
            c.event_end_date AS dateEnd,
            c.description, c.image_url AS image, c.price, c.capacity, c.created_at,
            COALESCE(c.max_event_days, 1) AS maxEventDays,
            COALESCE(c.allow_partial_days, 0) AS allowPartialDays,
            COALESCE(c.price_1_day, c.price) AS priceOneDay,
            c.price_2_days AS priceTwoDays,
            c.price_3_days AS priceThreeDays,
            c.event_type AS eventType, c.city, c.church_id AS churchId,
            c.min_age AS minAge, c.max_age AS maxAge,
            c.requires_church AS requiresChurch,
            c.requires_rank AS requiresRank,
            c.requires_confession_father AS requiresConfessionFather,
            c.requires_allergies AS requiresAllergies,
            c.target_church_id AS targetChurchId,
            c.target_city AS targetCity,
            c.target_rank AS targetRank,
            c.payment_link AS paymentLink,
            c.payment_qr_url AS paymentQrUrl,
            COALESCE(c.payment_link_1_day, c.payment_link) AS paymentLinkOneDay,
            c.payment_link_2_days AS paymentLinkTwoDays,
            c.payment_link_3_days AS paymentLinkThreeDays,
            COALESCE(c.payment_qr_url_1_day, c.payment_qr_url) AS paymentQrUrlOneDay,
            c.payment_qr_url_2_days AS paymentQrUrlTwoDays,
            c.payment_qr_url_3_days AS paymentQrUrlThreeDays,
            c.payment_contact_name AS paymentContactName,
            c.payment_contact_phone AS paymentContactPhone,
            c.payment_instructions AS paymentInstructions,
            c.google_sheet_id AS googleSheetId,
            c.google_sheet_url AS googleSheetUrl,
            c.google_sheet_last_synced_at AS googleSheetLastSyncedAt,
            c.google_sheet_last_error AS googleSheetLastError,
            c.registration_deadline AS registrationDeadline,
            c.email_subject AS emailSubject,
            c.email_body AS emailBody,
            c.archived_at AS archivedAt,
            COUNT(r.id) AS registeredCount,
            GREATEST(c.capacity - COUNT(r.id), 0) AS remainingCapacity
        FROM conferences c
        LEFT JOIN registrations r ON r.conference_id = c.id
            AND r.cancelled_at IS NULL
            AND r.registration_status <> 'rejected'
        WHERE c.archived_at IS NULL
        GROUP BY c.id
        ORDER BY c.conference_date ASC
    `);

    return rows;
}

async function getConferenceById(id) {
    const [rows] = await pool.query(`
        SELECT
            c.id, c.title, c.category, c.location, c.conference_date AS date,
            c.event_end_date AS dateEnd,
            c.description, c.image_url AS image, c.price, c.capacity, c.created_at,
            COALESCE(c.max_event_days, 1) AS maxEventDays,
            COALESCE(c.allow_partial_days, 0) AS allowPartialDays,
            COALESCE(c.price_1_day, c.price) AS priceOneDay,
            c.price_2_days AS priceTwoDays,
            c.price_3_days AS priceThreeDays,
            c.event_type AS eventType, c.city, c.church_id AS churchId,
            c.min_age AS minAge, c.max_age AS maxAge,
            c.requires_church AS requiresChurch,
            c.requires_rank AS requiresRank,
            c.requires_confession_father AS requiresConfessionFather,
            c.requires_allergies AS requiresAllergies,
            c.target_church_id AS targetChurchId,
            c.target_city AS targetCity,
            c.target_rank AS targetRank,
            c.payment_link AS paymentLink,
            c.payment_qr_url AS paymentQrUrl,
            COALESCE(c.payment_link_1_day, c.payment_link) AS paymentLinkOneDay,
            c.payment_link_2_days AS paymentLinkTwoDays,
            c.payment_link_3_days AS paymentLinkThreeDays,
            COALESCE(c.payment_qr_url_1_day, c.payment_qr_url) AS paymentQrUrlOneDay,
            c.payment_qr_url_2_days AS paymentQrUrlTwoDays,
            c.payment_qr_url_3_days AS paymentQrUrlThreeDays,
            c.payment_contact_name AS paymentContactName,
            c.payment_contact_phone AS paymentContactPhone,
            c.payment_instructions AS paymentInstructions,
            c.google_sheet_id AS googleSheetId,
            c.google_sheet_url AS googleSheetUrl,
            c.google_sheet_last_synced_at AS googleSheetLastSyncedAt,
            c.google_sheet_last_error AS googleSheetLastError,
            c.registration_deadline AS registrationDeadline,
            c.email_subject AS emailSubject,
            c.email_body AS emailBody,
            c.archived_at AS archivedAt,
            COUNT(r.id) AS registeredCount,
            GREATEST(c.capacity - COUNT(r.id), 0) AS remainingCapacity
        FROM conferences c
        LEFT JOIN registrations r ON r.conference_id = c.id
            AND r.cancelled_at IS NULL
            AND r.registration_status <> 'rejected'
        WHERE c.id = ? AND c.archived_at IS NULL
        GROUP BY c.id
    `, [id]);

    return rows[0];
}

async function createConference(conference) {
    const {
        title, category, location, date, dateEnd, description, image, price, capacity,
        maxEventDays, allowPartialDays, priceOneDay, priceTwoDays, priceThreeDays,
        eventType, city, churchId, minAge, maxAge,
        requiresChurch, requiresRank, requiresConfessionFather, requiresAllergies,
        targetChurchId, targetCity, targetRank,
        paymentLink, paymentQrUrl, paymentLinkOneDay, paymentLinkTwoDays, paymentLinkThreeDays,
        paymentQrUrlOneDay, paymentQrUrlTwoDays, paymentQrUrlThreeDays,
        paymentContactName, paymentContactPhone, paymentInstructions,
        registrationDeadline, emailSubject, emailBody
    } = conference;

    const [result] = await pool.query(`
        INSERT INTO conferences
        (
            title, category, location, conference_date, event_end_date, description, image_url, price,
            max_event_days, allow_partial_days, price_1_day, price_2_days, price_3_days, capacity,
            event_type, city, church_id, min_age, max_age,
            requires_church, requires_rank, requires_confession_father, requires_allergies,
            target_church_id, target_city, target_rank,
            payment_link, payment_qr_url, payment_link_1_day, payment_link_2_days, payment_link_3_days,
            payment_qr_url_1_day, payment_qr_url_2_days, payment_qr_url_3_days,
            payment_contact_name, payment_contact_phone, payment_instructions,
            registration_deadline, email_subject, email_body
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        title, category, location, date, dateEnd || null, description, image, price,
        Math.min(3, Math.max(1, Number(maxEventDays || 1))),
        booleanValue(allowPartialDays, false),
        priceOneDay ?? price ?? 0,
        optionalNumber(priceTwoDays),
        optionalNumber(priceThreeDays),
        capacity,
        eventType || "national",
        city || null,
        churchId || null,
        minAge || null,
        maxAge || null,
        !!requiresChurch,
        !!requiresRank,
        !!requiresConfessionFather,
        !!requiresAllergies,
        targetChurchId || null,
        targetCity || null,
        targetRank || null,
        paymentLink || paymentLinkOneDay || null,
        paymentQrUrl || paymentQrUrlOneDay || null,
        paymentLinkOneDay || paymentLink || null,
        paymentLinkTwoDays || null,
        paymentLinkThreeDays || null,
        paymentQrUrlOneDay || paymentQrUrl || null,
        paymentQrUrlTwoDays || null,
        paymentQrUrlThreeDays || null,
        paymentContactName || null,
        paymentContactPhone || null,
        paymentInstructions || null,
        registrationDeadline || null,
        emailSubject || null,
        emailBody || null
    ]);

    return getConferenceById(result.insertId);
}

async function getUsersForConferenceNotification(conference) {
    const [rows] = await pool.query(`
        SELECT
            u.id,
            u.name,
            u.email,
            up.birth_date AS birthDate,
            up.church_id AS churchId,
            up.city,
            up.rank_title AS rankTitle
        FROM users u
        LEFT JOIN user_profiles up ON up.user_id = u.id
        WHERE u.email IS NOT NULL
          AND u.newsletter_enabled = 1
          AND (? IS NULL OR up.church_id = ?)
          AND (? IS NULL OR LOWER(up.city) = LOWER(?))
          AND (? IS NULL OR LOWER(up.rank_title) = LOWER(?))
          AND (? IS NULL OR (
              up.birth_date IS NOT NULL
              AND TIMESTAMPDIFF(YEAR, up.birth_date, CURDATE()) >= ?
          ))
          AND (? IS NULL OR (
              up.birth_date IS NOT NULL
              AND TIMESTAMPDIFF(YEAR, up.birth_date, CURDATE()) <= ?
          ))
    `, [
        conference.targetChurchId || null,
        conference.targetChurchId || null,
        conference.targetCity || null,
        conference.targetCity || null,
        conference.targetRank || null,
        conference.targetRank || null,
        conference.minAge || null,
        conference.minAge || null,
        conference.maxAge || null,
        conference.maxAge || null
    ]);

    return rows;
}

async function getApprovedUsersForConference(conferenceId) {
    const [rows] = await pool.query(`
        SELECT
            r.id AS registrationId,
            r.payment_status AS paymentStatus,
            r.registration_status AS registrationStatus,
            r.shirt_size AS shirtSize,
            r.transport_option AS transportOption,
            r.selected_days AS selectedDays,
            COALESCE(r.selected_day_count, 1) AS selectedDayCount,
            COALESCE(r.selected_price, c.price) AS selectedPrice,
            r.admin_note AS adminNote,
            r.cancelled_at AS cancelledAt,
            r.payment_proof_uploaded_at AS paymentProofUploadedAt,
            r.approved_at AS approvedAt,
            r.created_at AS registeredAt,

            u.id AS userId,
            u.name AS userName,
            u.email AS userEmail,

            up.first_name AS firstName,
            up.last_name AS lastName,
            up.phone,
            up.birth_date AS birthDate,
            up.city AS profileCity,
            up.rank_title AS rankTitle,
            up.confession_father AS confessionFather,
            up.allergies,
            up.dietary_notes AS dietaryNotes,

            ch.name AS churchName,
            ch.city AS churchCity,

            c.id AS eventId,
            c.title AS eventTitle,
            c.conference_date AS eventDate,
            c.event_end_date AS eventDateEnd,
            c.location AS eventLocation,
            c.category AS eventCategory
        FROM registrations r
        INNER JOIN users u ON r.user_id = u.id
        INNER JOIN conferences c ON r.conference_id = c.id
        LEFT JOIN user_profiles up ON up.user_id = u.id
        LEFT JOIN churches ch ON ch.id = up.church_id
        WHERE r.conference_id = ?
        ORDER BY COALESCE(up.first_name, u.name), COALESCE(up.last_name, ''), u.name ASC
    `, [conferenceId]);

    return rows;
}

async function updateConference(id, conference) {
    const {
        title, category, location, date, dateEnd, description, image, price, capacity,
        maxEventDays, allowPartialDays, priceOneDay, priceTwoDays, priceThreeDays,
        eventType, city, churchId, minAge, maxAge,
        requiresChurch, requiresRank, requiresConfessionFather, requiresAllergies,
        targetChurchId, targetCity, targetRank,
        paymentLink, paymentQrUrl, paymentLinkOneDay, paymentLinkTwoDays, paymentLinkThreeDays,
        paymentQrUrlOneDay, paymentQrUrlTwoDays, paymentQrUrlThreeDays,
        paymentContactName, paymentContactPhone, paymentInstructions,
        registrationDeadline, emailSubject, emailBody
    } = conference;

    await pool.query(`
        UPDATE conferences
        SET
            title = ?,
            category = ?,
            location = ?,
            conference_date = ?,
            event_end_date = ?,
            description = ?,
            image_url = ?,
            price = ?,
            max_event_days = ?,
            allow_partial_days = ?,
            price_1_day = ?,
            price_2_days = ?,
            price_3_days = ?,
            capacity = ?,
            event_type = ?,
            city = ?,
            church_id = ?,
            min_age = ?,
            max_age = ?,
            requires_church = ?,
            requires_rank = ?,
            requires_confession_father = ?,
            requires_allergies = ?,
            target_church_id = ?,
            target_city = ?,
            target_rank = ?,
            payment_link = ?,
            payment_qr_url = ?,
            payment_link_1_day = ?,
            payment_link_2_days = ?,
            payment_link_3_days = ?,
            payment_qr_url_1_day = ?,
            payment_qr_url_2_days = ?,
            payment_qr_url_3_days = ?,
            payment_contact_name = ?,
            payment_contact_phone = ?,
            payment_instructions = ?,
            registration_deadline = ?,
            email_subject = ?,
            email_body = ?
        WHERE id = ?
    `, [
        title,
        category,
        location,
        date,
        dateEnd || null,
        description || "",
        image || "",
        Number(price || 0),
        Math.min(3, Math.max(1, Number(maxEventDays || 1))),
        booleanValue(allowPartialDays, false),
        priceOneDay ?? price ?? 0,
        optionalNumber(priceTwoDays),
        optionalNumber(priceThreeDays),
        Number(capacity || 100),
        eventType || "national",
        city || null,
        churchId || null,
        minAge || null,
        maxAge || null,
        !!requiresChurch,
        !!requiresRank,
        !!requiresConfessionFather,
        !!requiresAllergies,
        targetChurchId || null,
        targetCity || null,
        targetRank || null,
        paymentLink || paymentLinkOneDay || null,
        paymentQrUrl || paymentQrUrlOneDay || null,
        paymentLinkOneDay || paymentLink || null,
        paymentLinkTwoDays || null,
        paymentLinkThreeDays || null,
        paymentQrUrlOneDay || paymentQrUrl || null,
        paymentQrUrlTwoDays || null,
        paymentQrUrlThreeDays || null,
        paymentContactName || null,
        paymentContactPhone || null,
        paymentInstructions || null,
        registrationDeadline || null,
        emailSubject || null,
        emailBody || null,
        id
    ]);

    return getConferenceById(id);
}

async function deleteConference(id) {
    const [result] = await pool.query(
        `UPDATE conferences SET archived_at = NOW() WHERE id = ? AND archived_at IS NULL`,
        [id]
    );

    return result.affectedRows > 0;
}

module.exports = {
    getAllConferences,
    getConferenceById,
    createConference,
    getUsersForConferenceNotification,
    updateConference,
    deleteConference,
    getApprovedUsersForConference
};
