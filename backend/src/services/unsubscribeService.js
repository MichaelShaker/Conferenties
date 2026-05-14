const jwt = require("jsonwebtoken");
const pool = require("../config/db");

function createUnsubscribeToken(userId, email) {
    return jwt.sign(
        {
            type: "unsubscribe",
            id: userId,
            email
        },
        process.env.JWT_SECRET,
        { expiresIn: "180d" }
    );
}

function createUnsubscribeUrl(user) {
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3097").replace(/\/$/, "");
    const token = createUnsubscribeToken(user.id, user.email);

    return `${frontendUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
}

async function unsubscribeByToken(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "unsubscribe" || !decoded.id || !decoded.email) {
        throw new Error("Invalid unsubscribe token");
    }

    const [result] = await pool.query(`
        UPDATE users
        SET newsletter_enabled = 0
        WHERE id = ? AND email = ?
    `, [decoded.id, decoded.email]);

    return result.affectedRows > 0;
}

function createUnsubscribeFooter(user) {
    const unsubscribeUrl = createUnsubscribeUrl(user);

    return `
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 12px;">
        <p style="font-size: 12px; color: #64748b;">
            Je ontvangt deze mail omdat je emails over passende events aan hebt staan.
            <a href="${unsubscribeUrl}" style="color: #2563eb;">Afmelden voor event-emails</a>.
        </p>
    `;
}

module.exports = {
    createUnsubscribeUrl,
    createUnsubscribeFooter,
    unsubscribeByToken
};
