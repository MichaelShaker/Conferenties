const nodemailer = require('nodemailer');

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
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });
}

async function sendMail(to, subject, html) {
    try {
        const transporter = createTransporter();

        await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to,
            subject,
            html,
        });

        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

module.exports = {
    sendMail,
};
