const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { unsubscribeByToken } = require("../services/unsubscribeService");
const { sendError } = require("../utils/apiError");

async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return sendError(res, 400, "ACCOUNT_REQUIRED_FIELDS", {
                message: "Vul je naam, e-mailadres en wachtwoord in.",
                description: "We hebben deze gegevens nodig om je account aan te maken.",
                action: "Controleer het formulier en probeer opnieuw."
            });
        }

        const [existingUsers] = await pool.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return sendError(res, 409, "ACCOUNT_EMAIL_EXISTS", {
                message: "Er bestaat al een account met dit e-mailadres.",
                description: "Dit e-mailadres is al eerder geregistreerd.",
                action: "Log in met dit e-mailadres of gebruik wachtwoord vergeten."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                id: result.insertId,
                name,
                email,
                role: "user",
                profileCompleted: false // 👈 belangrijk
            }
        });
    } catch (error) {
        console.error("Register error:", error.message);

        sendError(res, 500, "ACCOUNT_REGISTER_FAILED", {
            message: "Account aanmaken is niet gelukt.",
            description: "Er ging iets mis bij het opslaan van je account.",
            action: "Probeer het later opnieuw. Blijft dit gebeuren, neem contact op met support."
        });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendError(res, 400, "LOGIN_REQUIRED_FIELDS", {
                message: "Vul je e-mailadres en wachtwoord in.",
                description: "Beide velden zijn nodig om in te loggen.",
                action: "Controleer het formulier en probeer opnieuw."
            });
        }

        // 🔥 BELANGRIJK: join met user_profiles
        const [users] = await pool.query(`
            SELECT 
                u.*,
                up.profile_completed AS profileCompleted
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.email = ?
            LIMIT 1
        `, [email]);

        const user = users[0];

        if (!user) {
            return sendError(res, 401, "LOGIN_INVALID_CREDENTIALS", {
                message: "E-mailadres of wachtwoord klopt niet.",
                description: "We kunnen geen account vinden met deze combinatie.",
                action: "Controleer je gegevens of gebruik wachtwoord vergeten."
            });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return sendError(res, 401, "LOGIN_INVALID_CREDENTIALS", {
                message: "E-mailadres of wachtwoord klopt niet.",
                description: "We kunnen geen account vinden met deze combinatie.",
                action: "Controleer je gegevens of gebruik wachtwoord vergeten."
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            message: "Login successful",
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    profileCompleted: !!user.profileCompleted // 👈 belangrijk
                }
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);

        sendError(res, 500, "LOGIN_FAILED", {
            message: "Inloggen lukt nu niet.",
            description: "Er ging iets mis tijdens het inloggen.",
            action: "Probeer het later opnieuw. Blijft dit gebeuren, geef de foutcode door aan support."
        });
    }
}

async function unsubscribe(req, res) {
    try {
        const { token } = req.body;

        if (!token) {
            return sendError(res, 400, "UNSUBSCRIBE_TOKEN_MISSING", {
                message: "Deze afmeldlink is niet compleet.",
                description: "De link mist informatie die nodig is om je af te melden.",
                action: "Gebruik de volledige link uit de e-mail of pas je voorkeuren aan in je account."
            });
        }

        const updated = await unsubscribeByToken(token);

        if (!updated) {
            return sendError(res, 404, "UNSUBSCRIBE_ACCOUNT_NOT_FOUND", {
                message: "We konden dit account niet vinden.",
                description: "De afmeldlink verwijst naar een account dat niet meer bestaat.",
                action: "Log in en controleer je e-mailvoorkeuren in je account."
            });
        }

        res.json({
            success: true,
            message: "Je bent afgemeld voor event-emails."
        });
    } catch (error) {
        console.error("Unsubscribe error:", error.message);

        sendError(res, 400, "UNSUBSCRIBE_TOKEN_INVALID", {
            message: "Deze afmeldlink is ongeldig of verlopen.",
            description: "Afmeldlinks zijn beveiligd en kunnen verlopen of ongeldig worden.",
            action: "Log in en pas je e-mailvoorkeuren aan in je account."
        });
    }
}

module.exports = {
    register,
    login,
    unsubscribe
};
