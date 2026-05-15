const pool = require("../config/db");

async function createRegistration(userId, conferenceId, registrationDetails = {}) {
    const { shirtSize, transportOption } = registrationDetails;

    const [userRows] = await pool.query(`
        SELECT id
        FROM users
        WHERE id = ?
    `, [userId]);

    if (userRows.length === 0) {
        return {
            error: "Your account was not found. Please log out and log in again.",
            status: 401
        };
    }

    const [conferenceRows] = await pool.query(`
        SELECT id, title, capacity, registration_deadline AS registrationDeadline
        FROM conferences
        WHERE id = ?
    `, [conferenceId]);

    const conference = conferenceRows[0];

    if (!conference) {
        return { error: "Conference not found", status: 404 };
    }

    if (conference.registrationDeadline) {
        const deadline = new Date(conference.registrationDeadline);
        deadline.setHours(23, 59, 59, 999);

        if (new Date() > deadline) {
            return { error: "The registration deadline has passed", status: 400 };
        }
    }

    const [existingRows] = await pool.query(`
        SELECT id
        FROM registrations
        WHERE user_id = ? AND conference_id = ?
    `, [userId, conferenceId]);

    if (existingRows.length > 0) {
        return { error: "You are already registered for this event", status: 409 };
    }

    const [countRows] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM registrations
        WHERE conference_id = ?
          AND cancelled_at IS NULL
          AND registration_status <> 'rejected'
    `, [conferenceId]);

    if (countRows[0].total >= conference.capacity) {
        return { error: "This event is full", status: 400 };
    }

    const [result] = await pool.query(`
        INSERT INTO registrations (user_id, conference_id, shirt_size, transport_option)
        VALUES (?, ?, ?, ?)
    `, [
        userId,
        conferenceId,
        shirtSize || null,
        transportOption || null
    ]);

    return { id: result.insertId };
}

async function getMyRegistrations(userId) {
    const [rows] = await pool.query(`
        SELECT
            r.id,
            r.payment_status AS paymentStatus,
            r.registration_status AS registrationStatus,
            r.shirt_size AS shirtSize,
            r.transport_option AS transportOption,
            r.admin_note AS adminNote,
            r.cancelled_at AS cancelledAt,
            r.created_at,
            c.id AS eventId,
            c.title AS eventTitle,
            c.category,
            c.location AS eventLocation,
            c.conference_date AS eventDate,
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
            r.registration_status AS registrationStatus,
            r.shirt_size AS shirtSize,
            r.transport_option AS transportOption,
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

async function updateRegistrationStatus(id, paymentStatus, registrationStatus, adminNote) {
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
            admin_note = ?,
            approved_at = CASE
                WHEN ? IN ('confirmed', 'approved', 'goedgekeurd') THEN COALESCE(approved_at, NOW())
                ELSE approved_at
            END
        WHERE id = ?
    `, [paymentStatus, registrationStatus, adminNote || null, registrationStatus, id]);

    const [rows] = await pool.query(`
        SELECT
            r.id,
            r.payment_status AS paymentStatus,
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
            c.conference_date AS eventDate
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
            r.registration_status AS registrationStatus,
            r.admin_note AS adminNote,
            r.cancelled_at AS cancelledAt,
            u.id AS userId,
            u.name AS userName,
            u.email AS userEmail,
            c.id AS eventId,
            c.title AS eventTitle,
            c.location AS eventLocation,
            c.conference_date AS eventDate
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
            payment_status = 'proof_uploaded'
        WHERE id = ? AND user_id = ?
    `, [paymentProof, id, userId]);

    const [rows] = await pool.query(`
        SELECT
            id,
            conference_id AS conferenceId,
            payment_status AS paymentStatus,
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
