const pool = require("../config/db");

async function logAudit({ actorUserId = null, action, entityType, entityId = null, details = null }) {
    try {
        await pool.query(`
            INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
            VALUES (?, ?, ?, ?, ?)
        `, [
            actorUserId,
            action,
            entityType,
            entityId,
            details ? JSON.stringify(details) : null
        ]);
    } catch (error) {
        console.error("Audit log error:", error.message);
    }
}

module.exports = {
    logAudit
};
