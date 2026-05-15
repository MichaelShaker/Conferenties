const nodemailer = require('nodemailer');
const googleService = require("./googleSheetsService");

const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const SMTP_TIMEOUT_MS = Number(process.env.MAIL_TIMEOUT_MS || 10000);

function assertMailConfig() {
    const requiredKeys = ["MAIL_HOST", "MAIL_PORT", "MAIL_USER", "MAIL_PASS", "MAIL_FROM"];
    const missingKeys = requiredKeys.filter(key => !process.env[key]);

    if (missingKeys.length > 0) {
        throw new Error(`Mail is not configured. Missing: ${missingKeys.join(", ")}`);
    }
}

function createTransporter() {
    assertMailConfig();

    return nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: Number(process.env.MAIL_PORT) === 465,
        connectionTimeout: SMTP_TIMEOUT_MS,
        greetingTimeout: SMTP_TIMEOUT_MS,
        socketTimeout: SMTP_TIMEOUT_MS,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });
}

function hasSmtpConfig() {
    return ["MAIL_HOST", "MAIL_PORT", "MAIL_USER", "MAIL_PASS", "MAIL_FROM"]
        .every(key => process.env[key]);
}

function encodeHeader(value) {
    const text = String(value || "");

    if (/^[\x00-\x7F]*$/.test(text)) {
        return text;
    }

    return `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
}

function stripHtml(html) {
    return String(html || "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function base64UrlEncode(value) {
    return Buffer.from(value, "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function buildGmailMessage({ from, to, subject, html }) {
    const boundary = `conferenties_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const text = stripHtml(html);

    return [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: ${encodeHeader(subject)}`,
        "MIME-Version: 1.0",
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: 8bit",
        "",
        text,
        "",
        `--${boundary}`,
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: 8bit",
        "",
        html,
        "",
        `--${boundary}--`
    ].join("\r\n");
}

async function sendViaGmailApi(to, subject, html) {
    const status = await googleService.getStatus();

    if (!status.connected) {
        throw new Error("Google is not connected. Connect Google before sending email.");
    }

    if (!status.canSendMail) {
        throw new Error("Google mail permission is missing. Reconnect Google to grant Gmail send access.");
    }

    const accessToken = await googleService.getAccessToken();
    const from = process.env.GMAIL_FROM || status.email || process.env.MAIL_FROM;
    const raw = base64UrlEncode(buildGmailMessage({ from, to, subject, html }));

    const response = await fetch(GMAIL_SEND_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ raw })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.error?.message || "Could not send email through Gmail API");
    }

    console.log(`Gmail API email sent to ${to}`);
}

async function sendViaSmtp(to, subject, html) {
    const transporter = createTransporter();

    console.log(`Sending SMTP email to ${to}`);

    await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        html,
    });

    console.log(`SMTP email sent to ${to}`);
}

async function sendMail(to, subject, html) {
    const provider = (process.env.MAIL_PROVIDER || "auto").toLowerCase();

    try {
        if (provider === "smtp") {
            await sendViaSmtp(to, subject, html);
            return;
        }

        await sendViaGmailApi(to, subject, html);
    } catch (error) {
        if (provider === "auto" && hasSmtpConfig()) {
            try {
                await sendViaSmtp(to, subject, html);
                return;
            } catch (smtpError) {
                console.error("SMTP fallback error:", smtpError);
            }
        }

        console.error("Error sending email:", error);
        throw error;
    }
}

module.exports = {
    sendMail,
};
