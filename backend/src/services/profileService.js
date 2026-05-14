const pool = require("../config/db");

async function getProfileByUserId(userId) {
    const [rows] = await pool.query(`
        SELECT
            up.*,
            u.newsletter_enabled AS newsletterEnabled,
            c.name AS churchName,
            c.city AS churchCity
        FROM user_profiles up
        INNER JOIN users u ON u.id = up.user_id
        LEFT JOIN churches c ON up.church_id = c.id
        WHERE up.user_id = ?
    `, [userId]);

    return rows[0];
}

async function upsertProfile(userId, profile) {
    const {
        firstName,
        lastName,
        phone,
        birthDate,
        churchId,
        city,
        rankTitle,
        confessionFather,
        allergies,
        dietaryNotes,
        shirtSize,
        transportOption,
        newsletterEnabled
    } = profile;

    const profileCompleted =
        firstName &&
        lastName &&
        phone &&
        birthDate &&
        churchId;

    await pool.query(`
        INSERT INTO user_profiles (
            user_id,
            first_name,
            last_name,
            phone,
            birth_date,
            church_id,
            city,
            rank_title,
            confession_father,
            allergies,
            dietary_notes,
            shirt_size,
            transport_option,
            profile_completed
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            phone = VALUES(phone),
            birth_date = VALUES(birth_date),
            church_id = VALUES(church_id),
            city = VALUES(city),
            rank_title = VALUES(rank_title),
            confession_father = VALUES(confession_father),
            allergies = VALUES(allergies),
            dietary_notes = VALUES(dietary_notes),
            shirt_size = VALUES(shirt_size),
            transport_option = VALUES(transport_option),
            profile_completed = VALUES(profile_completed)
    `, [
        userId,
        firstName,
        lastName,
        phone,
        birthDate,
        churchId || null,
        city,
        rankTitle,
        confessionFather,
        allergies,
        dietaryNotes,
        shirtSize || null,
        transportOption || null,
        !!profileCompleted
    ]);
    await pool.query(
        "UPDATE users SET name = ?, newsletter_enabled = ? WHERE id = ?",
        [`${firstName} ${lastName}`.trim(), newsletterEnabled === false ? 0 : 1, userId]
    );

    return getProfileByUserId(userId);
}

module.exports = {
    getProfileByUserId,
    upsertProfile
};
