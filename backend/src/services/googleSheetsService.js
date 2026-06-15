const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const conferenceService = require("./conferenceService");
const { addColumnIfMissing } = require("./schemaService");
const { encryptText, decryptText } = require("../utils/crypto");

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_SHEETS_URL = "https://sheets.googleapis.com/v4/spreadsheets";

const GOOGLE_SCOPES = [
    "openid",
    "email",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/gmail.send"
];

let ensureGoogleSchemaPromise = null;

class GoogleApiError extends Error {
    constructor(message, status, details = null) {
        super(message);
        this.name = "GoogleApiError";
        this.status = status;
        this.details = details;
    }
}

async function parseGoogleResponse(response, fallbackMessage) {
    const text = await response.text();
    let result = {};

    try {
        result = text ? JSON.parse(text) : {};
    } catch (error) {
        if (!response.ok) {
            throw new GoogleApiError(fallbackMessage, response.status, text);
        }

        throw new GoogleApiError("Google returned an invalid response", response.status, text);
    }

    if (!response.ok) {
        throw new GoogleApiError(
            result.error?.message || fallbackMessage,
            response.status,
            result.error || result
        );
    }

    return result;
}

function isRecoverableSpreadsheetAccessError(error) {
    return error instanceof GoogleApiError && [403, 404].includes(error.status);
}

function createA1Range(sheetTitle, cellRange) {
    const escapedTitle = String(sheetTitle).replace(/'/g, "''");
    return `'${escapedTitle}'!${cellRange}`;
}

function getGoogleConfig() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error("Google Sheets is not configured");
    }

    return {
        clientId,
        clientSecret,
        redirectUri
    };
}

async function ensureGoogleSchema() {
    if (ensureGoogleSchemaPromise) {
        return ensureGoogleSchemaPromise;
    }

    ensureGoogleSchemaPromise = (async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS google_oauth_tokens (
            id INT NOT NULL AUTO_INCREMENT,
            user_id INT NULL,
            google_email VARCHAR(255),
            refresh_token LONGTEXT NOT NULL,
            scope TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY one_connection (id)
        ) ENGINE=InnoDB
    `);

    await addColumnIfMissing("conferences", "google_sheet_id", "VARCHAR(255) NULL");
    await addColumnIfMissing("conferences", "google_sheet_url", "VARCHAR(500) NULL");
    await addColumnIfMissing("conferences", "google_sheet_last_synced_at", "TIMESTAMP NULL");
    await addColumnIfMissing("conferences", "google_sheet_last_error", "TEXT NULL");
    })();

    try {
        await ensureGoogleSchemaPromise;
    } catch (error) {
        ensureGoogleSchemaPromise = null;
        throw error;
    }
}

async function getConnection() {
    await ensureGoogleSchema();

    const [rows] = await pool.query(`
        SELECT *
        FROM google_oauth_tokens
        ORDER BY id DESC
        LIMIT 1
    `);

    return rows[0] || null;
}

async function getStatus() {
    const connection = await getConnection();
    const scope = connection?.scope || "";

    return {
        connected: !!connection,
        email: connection?.google_email || null,
        canSendMail: scope.includes("https://www.googleapis.com/auth/gmail.send")
    };
}

function createAuthUrl(adminUser) {
    const { clientId, redirectUri } = getGoogleConfig();
    const state = jwt.sign(
        {
            id: adminUser.id,
            role: adminUser.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        access_type: "offline",
        prompt: "consent",
        scope: GOOGLE_SCOPES.join(" "),
        state
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

async function exchangeCodeForTokens(code) {
    const { clientId, clientSecret, redirectUri } = getGoogleConfig();

    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code"
        })
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error_description || result.error || "Could not connect Google");
    }

    return result;
}

async function getUserInfo(accessToken) {
    const response = await fetch(GOOGLE_USERINFO_URL, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        return null;
    }

    return response.json();
}

async function saveConnection({ userId, refreshToken, scope, googleEmail }) {
    await ensureGoogleSchema();

    const existingConnection = await getConnection();
    const tokenToStore = refreshToken || (existingConnection ? decryptText(existingConnection.refresh_token) : null);

    if (!tokenToStore) {
        throw new Error("Google did not return a refresh token. Try connecting again.");
    }

    await pool.query(`
        DELETE FROM google_oauth_tokens
    `);

    await pool.query(`
        INSERT INTO google_oauth_tokens (user_id, google_email, refresh_token, scope)
        VALUES (?, ?, ?, ?)
    `, [
        userId || null,
        googleEmail || null,
        encryptText(tokenToStore),
        scope || null
    ]);
}

async function handleOAuthCallback({ code, state }) {
    if (!code || !state) {
        throw new Error("Missing Google callback data");
    }

    const decodedState = jwt.verify(state, process.env.JWT_SECRET);

    if (decodedState.role !== "admin") {
        throw new Error("Only admins can connect Google Sheets");
    }

    const tokens = await exchangeCodeForTokens(code);
    const userInfo = await getUserInfo(tokens.access_token);

    await saveConnection({
        userId: decodedState.id,
        refreshToken: tokens.refresh_token,
        scope: tokens.scope,
        googleEmail: userInfo?.email || null
    });

    return {
        email: userInfo?.email || null
    };
}

async function getAccessToken() {
    const { clientId, clientSecret } = getGoogleConfig();
    const connection = await getConnection();

    if (!connection) {
        throw new Error("Google Sheets is not connected");
    }

    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: decryptText(connection.refresh_token),
            grant_type: "refresh_token"
        })
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error_description || result.error || "Could not refresh Google token");
    }

    return result.access_token;
}

function formatSheetDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function isOnLocationList(registration) {
    return registration.paymentStatus === "paid"
        && ["confirmed", "approved", "goedgekeurd"].includes(registration.registrationStatus);
}

function formatTransportOption(option) {
    if (option === "own_transport") return "Eigen vervoer";
    if (option === "bus") return "Bus tegen aanvullende kosten";

    return option || "";
}

function formatGender(gender) {
    if (gender === "male") return "Man";
    if (gender === "female") return "Vrouw";
    if (gender === "other") return "Anders / liever niet zeggen";

    return gender || "";
}

function selectedDayCount(registration) {
    const days = parseSelection(registration.selectedDays);

    if (isLegacyFullEventRegistration(registration)) {
        return Number(registration.maxEventDays || registration.selectedDayCount || 1);
    }

    if (days.length > 0) {
        return Number(registration.selectedDayCount || days.length || 0);
    }

    return Number(registration.maxEventDays || registration.selectedDayCount || 1);
}

function formatSelectedDays(registration) {
    if (!registration.selectedDays || isLegacyFullEventRegistration(registration)) return "Hele conferentie";

    return String(registration.selectedDays)
        .split(",")
        .map(day => `Dag ${day.trim()}`)
        .join(", ");
}

function parseSelection(value) {
    if (!value) return [];

    return String(value)
        .split(",")
        .map(item => Number(item.trim()))
        .filter(Number.isInteger);
}

function isLegacyFullEventRegistration(registration) {
    const days = parseSelection(registration.selectedDays);
    const maxDays = Number(registration.maxEventDays || 1);
    const selectedPrice = Number(registration.selectedPrice || 0);
    const fullEventPrice = Number(registration.fullEventPrice || 0);

    if (!registration.selectedDays && maxDays > 1) return true;

    return maxDays > 1
        && days.length === 1
        && days[0] === 1
        && Number(registration.selectedDayCount || 1) === 1
        && fullEventPrice > 0
        && selectedPrice >= fullEventPrice;
}

function effectiveSelectedNights(registration) {
    const nights = parseSelection(registration.selectedNights);

    if (nights.length > 0) return nights;
    if (isLegacyFullEventRegistration(registration) && selectedDayCount(registration) > 1) {
        return Array.from({ length: Math.max(0, selectedDayCount(registration) - 1) }, (_, index) => index + 1);
    }

    return [];
}

function formatSelectedNights(registration) {
    const nights = effectiveSelectedNights(registration);

    if (nights.length === 0) return "Geen overnachting";

    return nights
        .map(night => {
            if (night === 1) return "Vrijdag op zaterdag";
            if (night === 2) return "Zaterdag op zondag";
            return `Nacht ${night}`;
        })
        .join(", ");
}

function countSelectedNights(registration) {
    return effectiveSelectedNights(registration).length;
}

function hasSelectedNight(registration, night) {
    return effectiveSelectedNights(registration).includes(night) ? "Ja" : "Nee";
}

function formatAttendanceType(registration) {
    const nights = effectiveSelectedNights(registration);
    const dayCount = selectedDayCount(registration);

    if (dayCount >= 3 && nights.length >= 2) return "Hele weekend";
    if (nights.length === 1) return "1 nacht";
    if (nights.length > 1) return `${nights.length} nachten`;
    if (dayCount === 1) return "1 dag";
    if (dayCount > 1) return `${dayCount} dagen`;

    return "Niet ingevuld";
}

function createSheetRows(registrations) {
    const headers = [
        "Registratie ID",
        "Voornaam",
        "Achternaam",
        "Volledige naam",
        "E-mail",
        "Telefoon",
        "Geslacht",
        "Shirtmaat",
        "Vervoer",
        "Aanwezigheidstype",
        "Gekozen dagen",
        "Gekozen nachten",
        "Aantal dagen",
        "Aantal nachten",
        "Nacht vrijdag-zaterdag",
        "Nacht zaterdag-zondag",
        "Prijs",
        "Geboortedatum",
        "Kerk",
        "Kerk stad",
        "Woonplaats",
        "Rang/functie",
        "Biechtvader",
        "Allergieën",
        "Dieet/notities",
        "Event",
        "Event datum",
        "Event locatie",
        "Betaalstatus",
        "Registratiestatus",
        "Op locatie lijst",
        "Betaalbewijs ontvangen",
        "Ingeschreven op"
    ];

    return [
        headers,
        ...registrations.map(registration => [
            registration.registrationId,
            registration.firstName || "",
            registration.lastName || "",
            registration.userName || "",
            registration.userEmail || "",
            registration.phone || "",
            formatGender(registration.gender),
            registration.shirtSize || "",
            formatTransportOption(registration.transportOption),
            formatAttendanceType(registration),
            formatSelectedDays(registration),
            formatSelectedNights(registration),
            selectedDayCount(registration),
            countSelectedNights(registration),
            hasSelectedNight(registration, 1),
            hasSelectedNight(registration, 2),
            registration.selectedPrice ?? "",
            formatSheetDate(registration.birthDate),
            registration.churchName || "",
            registration.churchCity || "",
            registration.profileCity || "",
            registration.rankTitle || "",
            registration.confessionFather || "",
            registration.allergies || "",
            registration.dietaryNotes || "",
            registration.eventTitle || "",
            formatSheetDate(registration.eventDate),
            registration.eventLocation || "",
            registration.paymentStatus || "",
            registration.registrationStatus || "",
            isOnLocationList(registration) ? "Ja" : "Nee",
            formatSheetDate(registration.paymentProofUploadedAt),
            formatSheetDate(registration.registeredAt)
        ])
    ];
}

function createSimpleRows(headers, registrations, mapper) {
    return [
        headers,
        ...registrations.map(mapper)
    ];
}

function createWorkbookTabs(registrations) {
    const approvedRegistrations = registrations.filter(isOnLocationList);
    const busRegistrations = registrations.filter(registration => registration.transportOption === "bus");
    const overnightRegistrations = registrations.filter(registration => effectiveSelectedNights(registration).length > 0);
    const shirtRegistrations = registrations.filter(registration => registration.shirtSize);

    return [
        {
            title: "Alle registraties",
            rows: createSheetRows(registrations)
        },
        {
            title: "Op locatie",
            rows: createSheetRows(approvedRegistrations)
        },
        {
            title: "Bus",
            rows: createSimpleRows(
                ["Naam", "E-mail", "Telefoon", "Geslacht", "Dagen", "Nachten", "Vrijdag-zaterdag", "Zaterdag-zondag", "Kerk", "Woonplaats", "Status"],
                busRegistrations,
                registration => [
                    registration.userName || "",
                    registration.userEmail || "",
                    registration.phone || "",
                    formatGender(registration.gender),
                    formatSelectedDays(registration),
                    formatSelectedNights(registration),
                    hasSelectedNight(registration, 1),
                    hasSelectedNight(registration, 2),
                    registration.churchName || "",
                    registration.profileCity || "",
                    registration.registrationStatus || ""
                ]
            )
        },
        {
            title: "Overnachting",
            rows: createSimpleRows(
                ["Naam", "E-mail", "Telefoon", "Geslacht", "Aanwezigheidstype", "Gekozen dagen", "Gekozen nachten", "Aantal nachten", "Vrijdag-zaterdag", "Zaterdag-zondag", "Status"],
                overnightRegistrations,
                registration => [
                    registration.userName || "",
                    registration.userEmail || "",
                    registration.phone || "",
                    formatGender(registration.gender),
                    formatAttendanceType(registration),
                    formatSelectedDays(registration),
                    formatSelectedNights(registration),
                    countSelectedNights(registration),
                    hasSelectedNight(registration, 1),
                    hasSelectedNight(registration, 2),
                    registration.registrationStatus || ""
                ]
            )
        },
        {
            title: "Shirtmaten",
            rows: createSimpleRows(
                ["Shirtmaat", "Naam", "E-mail", "Telefoon", "Geslacht", "Status"],
                shirtRegistrations.sort((a, b) => String(a.shirtSize || "").localeCompare(String(b.shirtSize || ""), "nl")),
                registration => [
                    registration.shirtSize || "",
                    registration.userName || "",
                    registration.userEmail || "",
                    registration.phone || "",
                    formatGender(registration.gender),
                    registration.registrationStatus || ""
                ]
            )
        }
    ];
}

async function getConferenceSheetInfo(conferenceId) {
    await ensureGoogleSchema();

    const [rows] = await pool.query(`
        SELECT
            id,
            title,
            google_sheet_id AS googleSheetId,
            google_sheet_url AS googleSheetUrl,
            google_sheet_last_synced_at AS googleSheetLastSyncedAt,
            google_sheet_last_error AS googleSheetLastError
        FROM conferences
        WHERE id = ?
    `, [conferenceId]);

    return rows[0] || null;
}

async function createSpreadsheet(accessToken, conference) {
    const response = await fetch(GOOGLE_SHEETS_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            properties: {
                title: `Deelnemers - ${conference.title}`
            },
            sheets: [
                { properties: { title: "Alle registraties" } },
                { properties: { title: "Op locatie" } },
                { properties: { title: "Bus" } },
                { properties: { title: "Shirtmaten" } }
            ]
        })
    });

    const result = await parseGoogleResponse(response, "Could not create Google Sheet");

    await pool.query(`
        UPDATE conferences
        SET google_sheet_id = ?, google_sheet_url = ?
        WHERE id = ?
    `, [
        result.spreadsheetId,
        result.spreadsheetUrl,
        conference.id
    ]);

    return {
        id: result.spreadsheetId,
        url: result.spreadsheetUrl,
        sheets: result.sheets || []
    };
}

async function getSheetProperties(accessToken, spreadsheetId) {
    const response = await fetch(
        `${GOOGLE_SHEETS_URL}/${spreadsheetId}?fields=sheets.properties(sheetId,title)`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    const result = await parseGoogleResponse(response, "Could not read Google Sheet metadata");

    return result.sheets?.map(sheet => sheet.properties) || [];
}

async function ensureWorkbookTabs(accessToken, spreadsheetId, tabTitles) {
    const existingSheets = await getSheetProperties(accessToken, spreadsheetId);
    const existingTitles = new Set(existingSheets.map(sheet => sheet.title));
    const missingTitles = tabTitles.filter(title => !existingTitles.has(title));

    if (missingTitles.length > 0) {
        const response = await fetch(`${GOOGLE_SHEETS_URL}/${spreadsheetId}:batchUpdate`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                requests: missingTitles.map(title => ({
                    addSheet: {
                        properties: { title }
                    }
                }))
            })
        });

        await parseGoogleResponse(response, "Could not add Google Sheet tabs");
    }

    return getSheetProperties(accessToken, spreadsheetId);
}

async function clearSheet(accessToken, spreadsheetId, title) {
    const response = await fetch(`${GOOGLE_SHEETS_URL}/${spreadsheetId}/values/${encodeURIComponent(createA1Range(title, "A:Z"))}:clear`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
    });

    await parseGoogleResponse(response, "Could not clear Google Sheet");
}

async function updateSheetValues(accessToken, spreadsheetId, title, rows) {
    const response = await fetch(
        `${GOOGLE_SHEETS_URL}/${spreadsheetId}/values/${encodeURIComponent(createA1Range(title, "A1"))}?valueInputOption=RAW`,
        {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                values: rows
            })
        }
    );

    await parseGoogleResponse(response, "Could not update Google Sheet");
}

async function formatSheet(accessToken, spreadsheetId, sheetId, columnCount = 24) {
    const response = await fetch(`${GOOGLE_SHEETS_URL}/${spreadsheetId}:batchUpdate`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            requests: [
                {
                    repeatCell: {
                        range: {
                            sheetId,
                            startRowIndex: 0,
                            endRowIndex: 1
                        },
                        cell: {
                            userEnteredFormat: {
                                textFormat: {
                                    bold: true
                                }
                            }
                        },
                        fields: "userEnteredFormat.textFormat.bold"
                    }
                },
                {
                    updateSheetProperties: {
                        properties: {
                            sheetId,
                            gridProperties: {
                                frozenRowCount: 1
                            }
                        },
                        fields: "gridProperties.frozenRowCount"
                    }
                },
                {
                    autoResizeDimensions: {
                        dimensions: {
                            sheetId,
                            dimension: "COLUMNS",
                            startIndex: 0,
                            endIndex: columnCount
                        }
                    }
                }
            ]
        })
    });

    await parseGoogleResponse(response, "Could not format Google Sheet");
}

async function markSheetSyncSuccess(conferenceId) {
    await pool.query(`
        UPDATE conferences
        SET google_sheet_last_synced_at = NOW(),
            google_sheet_last_error = NULL
        WHERE id = ?
    `, [conferenceId]);
}

async function markSheetSyncError(conferenceId, reason) {
    await pool.query(`
        UPDATE conferences
        SET google_sheet_last_error = ?
        WHERE id = ?
    `, [reason, conferenceId]);
}

async function clearConferenceSpreadsheet(conferenceId) {
    await pool.query(`
        UPDATE conferences
        SET google_sheet_id = NULL,
            google_sheet_url = NULL
        WHERE id = ?
    `, [conferenceId]);
}

async function getOrCreateSpreadsheet(accessToken, conference) {
    if (!conference.googleSheetId) {
        return createSpreadsheet(accessToken, conference);
    }

    try {
        return {
            id: conference.googleSheetId,
            url: conference.googleSheetUrl,
            sheets: await getSheetProperties(accessToken, conference.googleSheetId)
        };
    } catch (error) {
        if (!isRecoverableSpreadsheetAccessError(error)) {
            throw error;
        }

        await clearConferenceSpreadsheet(conference.id);
        return createSpreadsheet(accessToken, conference);
    }
}

async function syncConferenceSheetCore(conferenceId) {
    const status = await getStatus();

    if (!status.connected) {
        return {
            skipped: true,
            reason: "Google Sheets is not connected"
        };
    }

    const conference = await getConferenceSheetInfo(conferenceId);

    if (!conference) {
        throw new Error("Conference not found");
    }

    const accessToken = await getAccessToken();
    const sheet = await getOrCreateSpreadsheet(accessToken, conference);

    const registrations = await conferenceService.getApprovedUsersForConference(conferenceId);
    const tabs = createWorkbookTabs(registrations);
    const sheets = await ensureWorkbookTabs(accessToken, sheet.id, tabs.map(tab => tab.title));
    const sheetsByTitle = new Map(sheets.map(sheetProperties => [sheetProperties.title, sheetProperties]));

    for (const tab of tabs) {
        const sheetProperties = sheetsByTitle.get(tab.title);

        await clearSheet(accessToken, sheet.id, tab.title);
        await updateSheetValues(accessToken, sheet.id, tab.title, tab.rows);

        if (sheetProperties) {
            await formatSheet(accessToken, sheet.id, sheetProperties.sheetId, tab.rows[0]?.length || 1);
        }
    }

    await markSheetSyncSuccess(conferenceId);

    return {
        skipped: false,
        spreadsheetId: sheet.id,
        spreadsheetUrl: sheet.url,
        rowCount: registrations.length
    };
}

async function syncConferenceSheet(conferenceId) {
    try {
        return await syncConferenceSheetCore(conferenceId);
    } catch (error) {
        await markSheetSyncError(conferenceId, error.message);
        throw error;
    }
}

async function syncConferenceSheetQuietly(conferenceId) {
    try {
        return await syncConferenceSheet(conferenceId);
    } catch (error) {
        console.error("Google Sheets sync error:", error.message);
        return {
            skipped: true,
            reason: error.message
        };
    }
}

async function syncAllConferenceSheets() {
    const status = await getStatus();

    if (!status.connected) {
        return {
            skipped: true,
            reason: "Google Sheets is not connected",
            syncedCount: 0,
            failedCount: 0,
            results: []
        };
    }

    const conferences = await conferenceService.getAllConferences();
    const results = [];

    for (const conference of conferences) {
        try {
            const result = await syncConferenceSheet(conference.id);
            results.push({
                conferenceId: conference.id,
                title: conference.title,
                ok: true,
                ...result
            });
        } catch (error) {
            await markSheetSyncError(conference.id, error.message);
            results.push({
                conferenceId: conference.id,
                title: conference.title,
                ok: false,
                reason: error.message
            });
        }
    }

    return {
        skipped: false,
        syncedCount: results.filter(result => result.ok).length,
        failedCount: results.filter(result => !result.ok).length,
        results
    };
}

module.exports = {
    getStatus,
    createAuthUrl,
    handleOAuthCallback,
    getAccessToken,
    syncConferenceSheet,
    syncConferenceSheetQuietly,
    syncAllConferenceSheets
};
