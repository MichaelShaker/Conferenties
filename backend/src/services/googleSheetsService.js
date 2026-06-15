const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const conferenceService = require("./conferenceService");
const { addColumnIfMissing } = require("./schemaService");
const { encryptText, decryptText } = require("../utils/crypto");

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_SHEETS_URL = "https://sheets.googleapis.com/v4/spreadsheets";
const MANAGED_WORKBOOK_TITLES = [
    "Alle registraties",
    "Op locatie",
    "Bus",
    "Overnachting",
    "Shirtmaten"
];
const DEFAULT_GRID_ROW_COUNT = 1000;
const HEADER_ROW_HEIGHT_PX = 34;
const BODY_ROW_HEIGHT_PX = 28;
const SHEET_THEME = {
    header: { red: 0.21, green: 0.36, blue: 0.28 },
    headerText: { red: 1, green: 1, blue: 1 },
    text: { red: 0.16, green: 0.18, blue: 0.2 },
    border: { red: 0.86, green: 0.89, blue: 0.87 },
    firstBand: { red: 0.98, green: 0.99, blue: 0.98 },
    secondBand: { red: 0.94, green: 0.96, blue: 0.95 }
};
const COLUMN_WIDTHS_BY_HEADER = {
    "Registratie ID": 100,
    "Voornaam": 130,
    "Achternaam": 160,
    "Volledige naam": 190,
    "Naam": 190,
    "E-mail": 260,
    "Telefoon": 150,
    "Geslacht": 115,
    "Shirtmaat": 100,
    "Vervoer": 250,
    "Aanwezigheidstype": 160,
    "Dagen": 190,
    "Nachten": 220,
    "Gekozen dagen": 190,
    "Gekozen nachten": 220,
    "Aantal dagen": 115,
    "Aantal nachten": 125,
    "Nacht vrijdag-zaterdag": 155,
    "Nacht zaterdag-zondag": 160,
    "Vrijdag-zaterdag": 145,
    "Zaterdag-zondag": 150,
    "Prijs": 90,
    "Geboortedatum": 130,
    "Kerk": 190,
    "Kerk stad": 140,
    "Woonplaats": 150,
    "Rang/functie": 155,
    "Biechtvader": 165,
    "Allergieën": 220,
    "Dieet/notities": 240,
    "Event": 230,
    "Event datum": 130,
    "Event locatie": 190,
    "Betaalstatus": 135,
    "Registratiestatus": 150,
    "Status": 145,
    "Op locatie lijst": 135,
    "Betaalbewijs ontvangen": 175,
    "Ingeschreven op": 145
};
const VALIDATION_OPTIONS_BY_HEADER = {
    "Geslacht": ["Man", "Vrouw", "Anders / liever niet zeggen"],
    "Shirtmaat": ["XS", "S", "M", "L", "XL", "XXL"],
    "Vervoer": ["Eigen vervoer", "Bus tegen aanvullende kosten"],
    "Aanwezigheidstype": ["Hele weekend", "1 nacht", "2 nachten", "1 dag", "2 dagen", "3 dagen", "Niet ingevuld"],
    "Nacht vrijdag-zaterdag": ["Ja", "Nee"],
    "Nacht zaterdag-zondag": ["Ja", "Nee"],
    "Vrijdag-zaterdag": ["Ja", "Nee"],
    "Zaterdag-zondag": ["Ja", "Nee"],
    "Op locatie lijst": ["Ja", "Nee"]
};

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
            sheets: MANAGED_WORKBOOK_TITLES.map(title => ({
                properties: { title }
            }))
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
        `${GOOGLE_SHEETS_URL}/${spreadsheetId}?fields=sheets.properties(sheetId,title,index)`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    const result = await parseGoogleResponse(response, "Could not read Google Sheet metadata");

    return result.sheets?.map(sheet => sheet.properties) || [];
}

async function batchUpdateSpreadsheet(accessToken, spreadsheetId, requests, fallbackMessage) {
    if (!requests.length) {
        return {};
    }

    const response = await fetch(`${GOOGLE_SHEETS_URL}/${spreadsheetId}:batchUpdate`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ requests })
    });

    return parseGoogleResponse(response, fallbackMessage);
}

function getGridColumnCount(rows) {
    return Math.max(1, rows[0]?.length || 1);
}

function getGridRowCount(rows) {
    return Math.max(DEFAULT_GRID_ROW_COUNT, rows.length + 25);
}

function createInitialSheetProperties(tab, index) {
    return {
        title: tab.title,
        index,
        gridProperties: {
            rowCount: getGridRowCount(tab.rows),
            columnCount: getGridColumnCount(tab.rows),
            frozenRowCount: 1
        }
    };
}

async function rebuildWorkbookTabs(accessToken, spreadsheetId, tabs) {
    let existingSheets = await getSheetProperties(accessToken, spreadsheetId);
    const managedTitles = new Set(tabs.map(tab => tab.title));
    const sheetHasOnlyManagedTabs = existingSheets.length > 0
        && existingSheets.every(sheet => managedTitles.has(sheet.title));
    let temporarySheetId = null;

    if (sheetHasOnlyManagedTabs) {
        const temporaryTitle = `__sync_reset_${Date.now()}`;
        const result = await batchUpdateSpreadsheet(
            accessToken,
            spreadsheetId,
            [{ addSheet: { properties: { title: temporaryTitle } } }],
            "Could not prepare Google Sheet reset"
        );

        temporarySheetId = result.replies?.[0]?.addSheet?.properties?.sheetId || null;

        if (!temporarySheetId) {
            existingSheets = await getSheetProperties(accessToken, spreadsheetId);
            temporarySheetId = existingSheets.find(sheet => sheet.title === temporaryTitle)?.sheetId || null;
        }
    }

    const freshSheets = await getSheetProperties(accessToken, spreadsheetId);
    const deleteManagedTabRequests = freshSheets
        .filter(sheet => managedTitles.has(sheet.title))
        .map(sheet => ({
            deleteSheet: {
                sheetId: sheet.sheetId
            }
        }));
    const addManagedTabRequests = tabs.map((tab, index) => ({
        addSheet: {
            properties: createInitialSheetProperties(tab, index)
        }
    }));
    const cleanupRequests = temporarySheetId
        ? [{ deleteSheet: { sheetId: temporarySheetId } }]
        : [];

    await batchUpdateSpreadsheet(
        accessToken,
        spreadsheetId,
        [
            ...deleteManagedTabRequests,
            ...addManagedTabRequests,
            ...cleanupRequests
        ],
        "Could not rebuild Google Sheet tabs"
    );

    return getSheetProperties(accessToken, spreadsheetId);
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

function getColumnWidth(header) {
    if (COLUMN_WIDTHS_BY_HEADER[header]) {
        return COLUMN_WIDTHS_BY_HEADER[header];
    }

    return Math.min(220, Math.max(95, String(header || "").length * 9 + 32));
}

function createColumnWidthRequests(sheetId, headers) {
    return headers.map((header, index) => ({
        updateDimensionProperties: {
            range: {
                sheetId,
                dimension: "COLUMNS",
                startIndex: index,
                endIndex: index + 1
            },
            properties: {
                pixelSize: getColumnWidth(header)
            },
            fields: "pixelSize"
        }
    }));
}

function createColumnFormatRequests(sheetId, headers, targetHeaders, userEnteredFormat) {
    return headers
        .map((header, index) => ({ header, index }))
        .filter(({ header }) => targetHeaders.includes(header))
        .map(({ index }) => ({
            repeatCell: {
                range: {
                    sheetId,
                    startRowIndex: 1,
                    startColumnIndex: index,
                    endColumnIndex: index + 1
                },
                cell: {
                    userEnteredFormat
                },
                fields: "userEnteredFormat.horizontalAlignment"
            }
        }));
}

function createValidationRequests(sheetId, headers) {
    return headers
        .map((header, index) => ({
            index,
            options: VALIDATION_OPTIONS_BY_HEADER[header]
        }))
        .filter(({ options }) => options)
        .map(({ index, options }) => ({
            repeatCell: {
                range: {
                    sheetId,
                    startRowIndex: 1,
                    startColumnIndex: index,
                    endColumnIndex: index + 1
                },
                cell: {
                    dataValidation: {
                        condition: {
                            type: "ONE_OF_LIST",
                            values: options.map(option => ({
                                userEnteredValue: option
                            }))
                        },
                        strict: false,
                        showCustomUi: true
                    }
                },
                fields: "dataValidation"
            }
        }));
}

async function formatSheet(accessToken, spreadsheetId, sheetId, rows) {
    const headers = rows[0] || [];
    const columnCount = getGridColumnCount(rows);
    const gridRowCount = getGridRowCount(rows);
    const dataRowCount = Math.max(rows.length, 2);
    const centerAlignedHeaders = [
        "Geslacht",
        "Shirtmaat",
        "Aanwezigheidstype",
        "Nacht vrijdag-zaterdag",
        "Nacht zaterdag-zondag",
        "Vrijdag-zaterdag",
        "Zaterdag-zondag",
        "Op locatie lijst"
    ];
    const rightAlignedHeaders = [
        "Registratie ID",
        "Aantal dagen",
        "Aantal nachten",
        "Prijs"
    ];

    await batchUpdateSpreadsheet(
        accessToken,
        spreadsheetId,
        [
            {
                updateSheetProperties: {
                    properties: {
                        sheetId,
                        gridProperties: {
                            frozenRowCount: 1,
                            rowCount: gridRowCount,
                            columnCount
                        }
                    },
                    fields: "gridProperties.frozenRowCount,gridProperties.rowCount,gridProperties.columnCount"
                }
            },
            {
                repeatCell: {
                    range: {
                        sheetId,
                        startRowIndex: 0,
                        endRowIndex: gridRowCount,
                        startColumnIndex: 0,
                        endColumnIndex: columnCount
                    },
                    cell: {
                        userEnteredFormat: {
                            textFormat: {
                                fontFamily: "Arial",
                                fontSize: 10,
                                foregroundColor: SHEET_THEME.text
                            },
                            verticalAlignment: "MIDDLE",
                            wrapStrategy: "CLIP"
                        }
                    },
                    fields: "userEnteredFormat.textFormat,userEnteredFormat.verticalAlignment,userEnteredFormat.wrapStrategy"
                }
            },
            {
                repeatCell: {
                    range: {
                        sheetId,
                        startRowIndex: 0,
                        endRowIndex: 1,
                        startColumnIndex: 0,
                        endColumnIndex: columnCount
                    },
                    cell: {
                        userEnteredFormat: {
                            backgroundColor: SHEET_THEME.header,
                            horizontalAlignment: "CENTER",
                            verticalAlignment: "MIDDLE",
                            wrapStrategy: "CLIP",
                            textFormat: {
                                bold: true,
                                fontFamily: "Arial",
                                fontSize: 10,
                                foregroundColor: SHEET_THEME.headerText
                            }
                        }
                    },
                    fields: "userEnteredFormat.backgroundColor,userEnteredFormat.horizontalAlignment,userEnteredFormat.verticalAlignment,userEnteredFormat.wrapStrategy,userEnteredFormat.textFormat"
                }
            },
            {
                updateDimensionProperties: {
                    range: {
                        sheetId,
                        dimension: "ROWS",
                        startIndex: 0,
                        endIndex: 1
                    },
                    properties: {
                        pixelSize: HEADER_ROW_HEIGHT_PX
                    },
                    fields: "pixelSize"
                }
            },
            {
                updateDimensionProperties: {
                    range: {
                        sheetId,
                        dimension: "ROWS",
                        startIndex: 1,
                        endIndex: gridRowCount
                    },
                    properties: {
                        pixelSize: BODY_ROW_HEIGHT_PX
                    },
                    fields: "pixelSize"
                }
            },
            {
                addBanding: {
                    bandedRange: {
                        range: {
                            sheetId,
                            startRowIndex: 0,
                            endRowIndex: dataRowCount,
                            startColumnIndex: 0,
                            endColumnIndex: columnCount
                        },
                        rowProperties: {
                            headerColor: SHEET_THEME.header,
                            firstBandColor: SHEET_THEME.firstBand,
                            secondBandColor: SHEET_THEME.secondBand
                        }
                    }
                }
            },
            {
                setBasicFilter: {
                    filter: {
                        range: {
                            sheetId,
                            startRowIndex: 0,
                            endRowIndex: dataRowCount,
                            startColumnIndex: 0,
                            endColumnIndex: columnCount
                        }
                    }
                }
            },
            {
                updateBorders: {
                    range: {
                        sheetId,
                        startRowIndex: 0,
                        endRowIndex: dataRowCount,
                        startColumnIndex: 0,
                        endColumnIndex: columnCount
                    },
                    top: {
                        style: "SOLID",
                        width: 1,
                        color: SHEET_THEME.border
                    },
                    bottom: {
                        style: "SOLID",
                        width: 1,
                        color: SHEET_THEME.border
                    },
                    left: {
                        style: "SOLID",
                        width: 1,
                        color: SHEET_THEME.border
                    },
                    right: {
                        style: "SOLID",
                        width: 1,
                        color: SHEET_THEME.border
                    },
                    innerHorizontal: {
                        style: "SOLID",
                        width: 1,
                        color: SHEET_THEME.border
                    },
                    innerVertical: {
                        style: "SOLID",
                        width: 1,
                        color: SHEET_THEME.border
                    }
                }
            },
            ...createColumnWidthRequests(sheetId, headers),
            ...createColumnFormatRequests(
                sheetId,
                headers,
                centerAlignedHeaders,
                { horizontalAlignment: "CENTER" }
            ),
            ...createColumnFormatRequests(
                sheetId,
                headers,
                rightAlignedHeaders,
                { horizontalAlignment: "RIGHT" }
            ),
            ...createValidationRequests(sheetId, headers)
        ],
        "Could not format Google Sheet"
    );
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
    const sheets = await rebuildWorkbookTabs(accessToken, sheet.id, tabs);
    const sheetsByTitle = new Map(sheets.map(sheetProperties => [sheetProperties.title, sheetProperties]));

    for (const tab of tabs) {
        const sheetProperties = sheetsByTitle.get(tab.title);

        await updateSheetValues(accessToken, sheet.id, tab.title, tab.rows);

        if (sheetProperties) {
            await formatSheet(accessToken, sheet.id, sheetProperties.sheetId, tab.rows);
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
