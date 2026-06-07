const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { sendMail } = require("../services/mailService");
const { sendError } = require("../utils/apiError");

async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return sendError(res, 400, "PASSWORD_RESET_EMAIL_REQUIRED", {
                message: "Vul je e-mailadres in.",
                description: "We hebben je e-mailadres nodig om een resetlink te sturen.",
                action: "Vul je e-mailadres in en probeer opnieuw."
            });
        }

        const [users] = await pool.query(
            "SELECT id, name, email FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.json({
                success: true,
                message: "Als dit e-mailadres bekend is, sturen we een resetlink."
            });
        }

        const user = users[0];

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpires = new Date(Date.now() + 1000 * 60 * 30);

        await pool.query(
            `
            UPDATE users
            SET reset_token = ?, reset_token_expires = ?
            WHERE id = ?
            `,
            [resetToken, resetTokenExpires, user.id]
        );

        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        await sendMail(
            user.email,
            "Wachtwoord opnieuw instellen",
            `
            <h2>Wachtwoord vergeten</h2>
            <p>Beste ${user.name || "gebruiker"},</p>
            <p>Klik op de link hieronder om je wachtwoord opnieuw in te stellen.</p>
            <p><a href="${resetLink}">Wachtwoord opnieuw instellen</a></p>
            <p>Deze link is 30 minuten geldig.</p>
            `
        );

        res.json({
            success: true,
            message: "Als dit e-mailadres bekend is, sturen we een resetlink."
        });
    } catch (error) {
        console.error("Forgot password error:", error.message);
        sendError(res, 500, "PASSWORD_RESET_EMAIL_FAILED", {
            message: "Resetmail versturen is niet gelukt.",
            description: "Er ging iets mis bij het versturen van de e-mail.",
            action: "Probeer het later opnieuw. Controleer ook je spammap als je al een link hebt aangevraagd."
        });
    }
}

async function resetPassword(req, res) {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return sendError(res, 400, "PASSWORD_REQUIRED", {
                message: "Vul een nieuw wachtwoord in.",
                description: "Je kunt je wachtwoord pas wijzigen als je een nieuw wachtwoord kiest.",
                action: "Vul een nieuw wachtwoord in en probeer opnieuw."
            });
        }

        const [users] = await pool.query(
            `
            SELECT id
            FROM users
            WHERE reset_token = ?
              AND reset_token_expires > NOW()
            `,
            [token]
        );

        if (users.length === 0) {
            return sendError(res, 400, "PASSWORD_RESET_LINK_EXPIRED", {
                message: "Deze resetlink is verlopen of ongeldig.",
                description: "Resetlinks zijn tijdelijk geldig om je account te beschermen.",
                action: "Vraag opnieuw een wachtwoord-reset aan."
            });
        }

        const user = users[0];
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            `
            UPDATE users
            SET password = ?,
                reset_token = NULL,
                reset_token_expires = NULL
            WHERE id = ?
            `,
            [hashedPassword, user.id]
        );

        res.json({
            success: true,
            message: "Je wachtwoord is aangepast. Je kunt nu inloggen."
        });
    } catch (error) {
        console.error("Reset password error:", error.message);
        sendError(res, 500, "PASSWORD_RESET_FAILED", {
            message: "Wachtwoord aanpassen is niet gelukt.",
            description: "Er ging iets mis bij het opslaan van je nieuwe wachtwoord.",
            action: "Probeer het later opnieuw of vraag een nieuwe resetlink aan."
        });
    }
}

module.exports = {
    forgotPassword,
    resetPassword
};
