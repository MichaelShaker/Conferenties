const pool = require("../config/db");

async function getAllConferences() {
    const [rows] = await pool.query(`
        SELECT
            id, title, category, location, conference_date AS date,
            description, image_url AS image, price, capacity, created_at,
            event_type AS eventType, city, church_id AS churchId,
            min_age AS minAge, max_age AS maxAge,
            requires_church AS requiresChurch,
            requires_rank AS requiresRank,
            requires_confession_father AS requiresConfessionFather,
            requires_allergies AS requiresAllergies,
            target_church_id AS targetChurchId,
            target_city AS targetCity,
            target_rank AS targetRank,
            payment_link AS paymentLink,
            payment_qr_url AS paymentQrUrl,
            payment_contact_name AS paymentContactName,
            payment_contact_phone AS paymentContactPhone,
            payment_instructions AS paymentInstructions
        FROM conferences
        ORDER BY conference_date ASC
    `);

    return rows;
}

async function getConferenceById(id) {
    const [rows] = await pool.query(`
        SELECT
            id, title, category, location, conference_date AS date,
            description, image_url AS image, price, capacity, created_at,
            event_type AS eventType, city, church_id AS churchId,
            min_age AS minAge, max_age AS maxAge,
            requires_church AS requiresChurch,
            requires_rank AS requiresRank,
            requires_confession_father AS requiresConfessionFather,
            requires_allergies AS requiresAllergies,
            target_church_id AS targetChurchId,
            target_city AS targetCity,
            target_rank AS targetRank,
            payment_link AS paymentLink,
            payment_qr_url AS paymentQrUrl,
            payment_contact_name AS paymentContactName,
            payment_contact_phone AS paymentContactPhone,
            payment_instructions AS paymentInstructions
        FROM conferences
        WHERE id = ?
    `, [id]);

    return rows[0];
}

async function createConference(conference) {
    const {
        title, category, location, date, description, image, price, capacity,
        eventType, city, churchId, minAge, maxAge,
        requiresChurch, requiresRank, requiresConfessionFather, requiresAllergies,
        targetChurchId, targetCity, targetRank,
        paymentLink, paymentQrUrl, paymentContactName, paymentContactPhone, paymentInstructions
    } = conference;

    const [result] = await pool.query(`
        INSERT INTO conferences
        (
            title, category, location, conference_date, description, image_url, price, capacity,
            event_type, city, church_id, min_age, max_age,
            requires_church, requires_rank, requires_confession_father, requires_allergies,
            target_church_id, target_city, target_rank,
            payment_link, payment_qr_url, payment_contact_name, payment_contact_phone, payment_instructions
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        title, category, location, date, description, image, price, capacity,
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
        paymentLink || null,
        paymentQrUrl || null,
        paymentContactName || null,
        paymentContactPhone || null,
        paymentInstructions || null
    ]);

    return getConferenceById(result.insertId);
}

async function getUsersForConferenceNotification(conference) {
    const [rows] = await pool.query(`
        SELECT id, name, email
        FROM users
        WHERE email IS NOT NULL
          AND newsletter_enabled = 1
    `);

    return rows;
}

async function updateConference(id, conference) {
    const {
        title,
        category,
        location,
        date,
        description,
        image,
        price,
        capacity
    } = conference;

    await pool.query(`
        UPDATE conferences
        SET
            title = ?,
            category = ?,
            location = ?,
            conference_date = ?,
            description = ?,
            image_url = ?,
            price = ?,
            capacity = ?
        WHERE id = ?
    `, [
        title,
        category,
        location,
        date,
        description,
        image,
        price,
        capacity,
        id
    ]);

    return getConferenceById(id);
}

async function deleteConference(id) {
    const [result] = await pool.query(
        `DELETE FROM conferences WHERE id = ?`,
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
    deleteConference
};