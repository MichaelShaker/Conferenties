const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { sendMail } = require("../services/mailService");

async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const [users] = await pool.query(
            "SELECT id, name, email FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.json({
                success: true,
                message: "If this email exists, a reset link has been sent"
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
            message: "If this email exists, a reset link has been sent"
        });
    } catch (error) {
        console.error("Forgot password error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not send reset email"
        });
    }
}

async function resetPassword(req, res) {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
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
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
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
            message: "Password reset successfully"
        });
    } catch (error) {
        console.error("Reset password error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not reset password"
        });
    }
}

module.exports = {
    forgotPassword,
    resetPassword
};