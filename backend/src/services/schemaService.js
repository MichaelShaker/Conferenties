const pool = require("../config/db");

async function columnExists(tableName, columnName) {
    const [rows] = await pool.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
    `, [tableName, columnName]);

    return rows.length > 0;
}

async function addColumnIfMissing(tableName, columnName, definition) {
    if (await columnExists(tableName, columnName)) {
        return;
    }

    await pool.query(`
        ALTER TABLE ${tableName}
        ADD COLUMN ${columnName} ${definition}
    `);
}

async function ensureAppSchema() {
    await addColumnIfMissing("registrations", "shirt_size", "VARCHAR(20) NULL");
    await addColumnIfMissing("registrations", "transport_option", "VARCHAR(50) NULL");
    await addColumnIfMissing("registrations", "admin_note", "TEXT NULL");
    await addColumnIfMissing("registrations", "cancelled_at", "TIMESTAMP NULL");
    await addColumnIfMissing("user_profiles", "shirt_size", "VARCHAR(20) NULL");
    await addColumnIfMissing("user_profiles", "transport_option", "VARCHAR(50) NULL");
    await addColumnIfMissing("conferences", "event_end_date", "DATE NULL");
    await addColumnIfMissing("conferences", "registration_deadline", "DATE NULL");
    await addColumnIfMissing("conferences", "email_subject", "VARCHAR(255) NULL");
    await addColumnIfMissing("conferences", "email_body", "TEXT NULL");
    await addColumnIfMissing("conferences", "google_sheet_last_synced_at", "TIMESTAMP NULL");
    await addColumnIfMissing("conferences", "google_sheet_last_error", "TEXT NULL");
    await addColumnIfMissing("conferences", "archived_at", "TIMESTAMP NULL");

    await pool.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INT NOT NULL AUTO_INCREMENT,
            actor_user_id INT NULL,
            action VARCHAR(100) NOT NULL,
            entity_type VARCHAR(100) NOT NULL,
            entity_id INT NULL,
            details JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_audit_entity (entity_type, entity_id),
            KEY idx_audit_actor (actor_user_id),
            CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS email_logs (
            id INT NOT NULL AUTO_INCREMENT,
            actor_user_id INT NULL,
            conference_id INT NULL,
            registration_id INT NULL,
            email_type VARCHAR(100) NOT NULL,
            recipient_email VARCHAR(255) NULL,
            subject VARCHAR(255) NULL,
            status VARCHAR(50) NOT NULL,
            error_message TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_email_conference (conference_id),
            KEY idx_email_registration (registration_id),
            KEY idx_email_actor (actor_user_id),
            CONSTRAINT fk_email_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
            CONSTRAINT fk_email_conference FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE SET NULL,
            CONSTRAINT fk_email_registration FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE SET NULL
        ) ENGINE=InnoDB
    `);
}

module.exports = {
    ensureAppSchema,
    addColumnIfMissing
};
