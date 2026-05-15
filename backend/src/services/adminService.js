const pool = require("../config/db");
const googleSheetsService = require("./googleSheetsService");

async function getAuditLogs(limit = 100) {
    const [rows] = await pool.query(`
        SELECT
            al.id,
            al.action,
            al.entity_type AS entityType,
            al.entity_id AS entityId,
            al.details,
            al.created_at AS createdAt,
            u.id AS actorUserId,
            u.name AS actorName,
            u.email AS actorEmail
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.actor_user_id
        ORDER BY al.created_at DESC
        LIMIT ?
    `, [Number(limit)]);

    return rows;
}

async function getEmailLogs(limit = 100) {
    const [rows] = await pool.query(`
        SELECT
            el.id,
            el.email_type AS emailType,
            el.recipient_email AS recipientEmail,
            el.subject,
            el.status,
            el.error_message AS errorMessage,
            el.created_at AS createdAt,
            c.title AS eventTitle,
            u.name AS actorName,
            u.email AS actorEmail
        FROM email_logs el
        LEFT JOIN conferences c ON c.id = el.conference_id
        LEFT JOIN users u ON u.id = el.actor_user_id
        ORDER BY el.created_at DESC
        LIMIT ?
    `, [Number(limit)]);

    return rows;
}

async function getUsers() {
    const [rows] = await pool.query(`
        SELECT
            u.id,
            u.name,
            u.email,
            u.role,
            u.newsletter_enabled AS newsletterEnabled,
            u.created_at AS createdAt,
            up.profile_completed AS profileCompleted,
            up.phone,
            up.city,
            ch.name AS churchName,
            COALESCE(rc.registrationCount, 0) AS registrationCount
        FROM users u
        LEFT JOIN user_profiles up ON up.user_id = u.id
        LEFT JOIN churches ch ON ch.id = up.church_id
        LEFT JOIN (
            SELECT user_id, COUNT(*) AS registrationCount
            FROM registrations
            GROUP BY user_id
        ) rc ON rc.user_id = u.id
        ORDER BY u.created_at DESC
    `);

    return rows;
}

async function updateUser(id, updates) {
    const allowedRoles = ["user", "admin"];
    const role = allowedRoles.includes(updates.role) ? updates.role : null;
    const newsletterEnabled = typeof updates.newsletterEnabled === "boolean"
        ? (updates.newsletterEnabled ? 1 : 0)
        : null;

    if (!role && newsletterEnabled === null) {
        return null;
    }

    const assignments = [];
    const values = [];

    if (role) {
        assignments.push("role = ?");
        values.push(role);
    }

    if (newsletterEnabled !== null) {
        assignments.push("newsletter_enabled = ?");
        values.push(newsletterEnabled);
    }

    values.push(id);

    await pool.query(`
        UPDATE users
        SET ${assignments.join(", ")}
        WHERE id = ?
    `, values);

    const [rows] = await pool.query(`
        SELECT
            id,
            name,
            email,
            role,
            newsletter_enabled AS newsletterEnabled
        FROM users
        WHERE id = ?
    `, [id]);

    return rows[0] || null;
}

async function getSystemStatus() {
    const checks = {
        database: {
            ok: false,
            message: "Not checked"
        },
        mail: {
            ok: false,
            message: "Not checked"
        },
        googleSheets: {
            ok: false,
            message: "Not checked",
            email: null
        }
    };

    try {
        await pool.query("SELECT 1");
        checks.database = {
            ok: true,
            message: "Connected"
        };
    } catch (error) {
        checks.database = {
            ok: false,
            message: error.message
        };
    }

    try {
        const googleStatus = await googleSheetsService.getStatus();
        checks.googleSheets = {
            ok: googleStatus.connected,
            message: googleStatus.connected ? "Connected" : "Not connected",
            email: googleStatus.email
        };

        const mailProvider = (process.env.MAIL_PROVIDER || "auto").toLowerCase();
        const mailKeys = ["MAIL_HOST", "MAIL_PORT", "MAIL_USER", "MAIL_PASS", "MAIL_FROM"];
        const missingMailKeys = mailKeys.filter(key => !process.env[key]);
        const hasSmtpConfig = missingMailKeys.length === 0;

        if (mailProvider !== "smtp" && googleStatus.connected && googleStatus.canSendMail) {
            checks.mail = {
                ok: true,
                message: `Gmail API connected as ${googleStatus.email || "Google account"}`
            };
        } else if ((mailProvider === "smtp" || mailProvider === "auto") && hasSmtpConfig) {
            checks.mail = {
                ok: true,
                message: "SMTP configured"
            };
        } else if (mailProvider !== "smtp" && googleStatus.connected && !googleStatus.canSendMail) {
            checks.mail = {
                ok: false,
                message: "Reconnect Google to grant Gmail send access"
            };
        } else {
            checks.mail = {
                ok: false,
                message: `Missing: ${missingMailKeys.join(", ")}`
            };
        }
    } catch (error) {
        checks.googleSheets = {
            ok: false,
            message: error.message,
            email: null
        };
        checks.mail = {
            ok: false,
            message: error.message
        };
    }

    const [eventRows] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM conferences
        WHERE archived_at IS NULL
    `);
    const [registrationRows] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM registrations
        WHERE cancelled_at IS NULL
    `);
    const [emailRows] = await pool.query(`
        SELECT
            MAX(created_at) AS lastEmailAt,
            SUM(status = 'failed') AS failedEmails
        FROM email_logs
    `);
    const [syncRows] = await pool.query(`
        SELECT
            MAX(google_sheet_last_synced_at) AS lastSheetSyncAt,
            SUM(google_sheet_last_error IS NOT NULL) AS sheetSyncErrors
        FROM conferences
    `);

    return {
        checks,
        metrics: {
            activeEvents: eventRows[0]?.total || 0,
            activeRegistrations: registrationRows[0]?.total || 0,
            lastEmailAt: emailRows[0]?.lastEmailAt || null,
            failedEmails: Number(emailRows[0]?.failedEmails || 0),
            lastSheetSyncAt: syncRows[0]?.lastSheetSyncAt || null,
            sheetSyncErrors: Number(syncRows[0]?.sheetSyncErrors || 0)
        },
        app: {
            environment: process.env.NODE_ENV || "development",
            version: process.env.npm_package_version || "unknown"
        }
    };
}

module.exports = {
    getAuditLogs,
    getEmailLogs,
    getUsers,
    updateUser,
    getSystemStatus
};
