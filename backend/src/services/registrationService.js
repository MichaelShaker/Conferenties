const pool = require("../config/db");

async function createRegistration(userId, conferenceId) {
    const [conferenceRows] = await pool.query(`
        SELECT id, title, capacity
        FROM conferences
        WHERE id = ?
    `, [conferenceId]);

    const conference = conferenceRows[0];

    if (!conference) {
        return { error: "Conference not found", status: 404 };
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
    `, [conferenceId]);

    if (countRows[0].total >= conference.capacity) {
        return { error: "This event is full", status: 400 };
    }

    const [result] = await pool.query(`
        INSERT INTO registrations (user_id, conference_id)
        VALUES (?, ?)
    `, [userId, conferenceId]);

    return { id: result.insertId };
}

async function getMyRegistrations(userId) {
    const [rows] = await pool.query(`
        SELECT
            r.id,
            r.payment_status AS paymentStatus,
            r.registration_status AS registrationStatus,
            r.created_at,
            c.id AS eventId,
            c.title AS eventTitle,
            c.category,
            c.location AS eventLocation,
            c.conference_date AS eventDate,
            c.price,
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
        ORDER BY r.created_at DESC
    `);

    return rows;
}

async function updateRegistrationStatus(id, paymentStatus, registrationStatus) {
    await pool.query(`
        UPDATE registrations
        SET payment_status = ?, registration_status = ?
        WHERE id = ?
    `, [paymentStatus, registrationStatus, id]);

    const [rows] = await pool.query(`
        SELECT
            r.id,
            r.payment_status AS paymentStatus,
            r.registration_status AS registrationStatus,
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
    `, [id]);

    return rows[0];
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
    uploadPaymentProof
};