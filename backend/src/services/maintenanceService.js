const pool = require("../config/db");

const SETTINGS_KEY = "maintenance";

const DEFAULT_SETTINGS = {
    enabled: false,
    title: "Tijdelijk onderhoud",
    message: "We werken aan de website. Probeer het later opnieuw.",
    expectedBackAt: "",
    contactEmail: ""
};

function normalizeSettings(value = {}) {
    return {
        ...DEFAULT_SETTINGS,
        enabled: value.enabled === true || value.enabled === 1,
        title: sanitizeText(value.title, DEFAULT_SETTINGS.title, 120),
        message: sanitizeText(value.message, DEFAULT_SETTINGS.message, 800),
        expectedBackAt: sanitizeText(value.expectedBackAt, "", 120),
        contactEmail: sanitizeText(value.contactEmail, "", 180)
    };
}

function sanitizeText(value, fallback, maxLength) {
    if (typeof value !== "string") {
        return fallback;
    }

    const trimmed = value.trim();

    if (!trimmed) {
        return fallback;
    }

    return trimmed.slice(0, maxLength);
}

async function getMaintenanceSettings() {
    const [rows] = await pool.query(`
        SELECT setting_value AS settingValue
        FROM app_settings
        WHERE setting_key = ?
        LIMIT 1
    `, [SETTINGS_KEY]);

    if (!rows.length) {
        return DEFAULT_SETTINGS;
    }

    try {
        return normalizeSettings(JSON.parse(rows[0].settingValue || "{}"));
    } catch (error) {
        return DEFAULT_SETTINGS;
    }
}

async function updateMaintenanceSettings(payload) {
    const settings = normalizeSettings(payload);

    await pool.query(`
        INSERT INTO app_settings (setting_key, setting_value)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
            setting_value = VALUES(setting_value),
            updated_at = CURRENT_TIMESTAMP
    `, [SETTINGS_KEY, JSON.stringify(settings)]);

    return settings;
}

module.exports = {
    getMaintenanceSettings,
    updateMaintenanceSettings
};
