const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { unsubscribeByToken } = require("../services/unsubscribeService");

async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        const [existingUsers] = await pool.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email is already in use"
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

        res.status(500).json({
            success: false,
            message: "Could not register user"
        });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
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
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
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

        res.status(500).json({
            success: false,
            message: "Could not login"
        });
    }
}

async function unsubscribe(req, res) {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Unsubscribe token is required"
            });
        }

        const updated = await unsubscribeByToken(token);

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: "Je bent afgemeld voor event-emails."
        });
    } catch (error) {
        console.error("Unsubscribe error:", error.message);

        res.status(400).json({
            success: false,
            message: "Deze afmeldlink is ongeldig of verlopen."
        });
    }
}

module.exports = {
    register,
    login,
    unsubscribe
};
