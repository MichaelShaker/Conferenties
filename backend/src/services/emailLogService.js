const pool = require("../config/db");

async function logEmail({
    actorUserId = null,
    conferenceId = null,
    registrationId = null,
    emailType,
    recipientEmail = null,
    subject = null,
    status,
    errorMessage = null
}) {
    try {
        await pool.query(`
            INSERT INTO email_logs (
                actor_user_id, conference_id, registration_id, email_type,
                recipient_email, subject, status, error_message
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            actorUserId,
            conferenceId,
            registrationId,
            emailType,
            recipientEmail,
            subject,
            status,
            errorMessage
        ]);
    } catch (error) {
        console.error("Email log error:", error.message);
    }
}

module.exports = {
    logEmail
};
