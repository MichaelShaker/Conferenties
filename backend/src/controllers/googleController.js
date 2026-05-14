const googleSheetsService = require("../services/googleSheetsService");
const { escapeHtml } = require("../utils/html");

async function getStatus(req, res) {
    try {
        const status = await googleSheetsService.getStatus();

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Could not get Google status"
        });
    }
}

async function getAuthUrl(req, res) {
    try {
        const authUrl = googleSheetsService.createAuthUrl(req.user);

        res.json({
            success: true,
            data: {
                authUrl
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Could not start Google connection"
        });
    }
}

async function handleCallback(req, res) {
    try {
        const result = await googleSheetsService.handleOAuthCallback(req.query);

        res.send(`
            <!doctype html>
            <html lang="en">
                <head>
                    <meta charset="utf-8" />
                    <title>Google connected</title>
                    <style>
                        body {
                            margin: 0;
                            min-height: 100vh;
                            display: grid;
                            place-items: center;
                            font-family: Arial, sans-serif;
                            background: #f8fafc;
                            color: #0f172a;
                        }
                        main {
                            max-width: 560px;
                            padding: 34px;
                            border: 1px solid #e2e8f0;
                            border-radius: 20px;
                            background: white;
                            box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
                        }
                        h1 { margin-top: 0; }
                        p { color: #64748b; line-height: 1.6; }
                    </style>
                </head>
                <body>
                    <main>
                        <h1>Google Sheets connected</h1>
                        <p>${escapeHtml(result.email || "The Google account")} is connected. You can close this tab and return to the admin dashboard.</p>
                    </main>
                </body>
            </html>
        `);
    } catch (error) {
        res.status(400).send(`
            <!doctype html>
            <html lang="en">
                <head><meta charset="utf-8" /><title>Google connection failed</title></head>
                <body>
                    <h1>Google connection failed</h1>
                    <p>${escapeHtml(error.message || "Could not connect Google Sheets")}</p>
                </body>
            </html>
        `);
    }
}

async function syncConference(req, res) {
    try {
        const result = await googleSheetsService.syncConferenceSheet(req.params.id);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Could not sync Google Sheet"
        });
    }
}

async function syncAllConferences(req, res) {
    try {
        const result = await googleSheetsService.syncAllConferenceSheets();

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Could not sync Google Sheets"
        });
    }
}

module.exports = {
    getStatus,
    getAuthUrl,
    handleCallback,
    syncConference,
    syncAllConferences
};
