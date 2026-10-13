const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

// LOGIN
const login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    const sql = `
        SELECT
            u.id,
            u.name,
            u.email,
            u.password_hash,
            u.is_active,
            r.name AS role,
            s.id AS student_id
        FROM users u
        JOIN roles r
            ON u.role_id = r.id
        LEFT JOIN students s
            ON s.user_id = u.id
        WHERE u.email = ?
        LIMIT 1
    `;

    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Database error during login"
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = results[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: "User account is inactive"
            });
        }

        try {
            const passwordMatch = await bcrypt.compare(
                password,
                user.password_hash
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }

            // Student profile verification
            if (user.role === "Student" && !user.student_id) {
                return res.status(403).json({
                    success: false,
                    message: "Student profile not found"
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                    studentId: user.student_id || null
                },
                process.env.JWT_SECRET || "development_secret",
                {
                    expiresIn: "1h"
                }
            );

            return res.json({
                success: true,
                message: "Login successful",
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    student_id: user.student_id || null
                }
            });

        } catch (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: "Login failed"
            });
        }
    });
};


// LOGOUT
const logout = (req, res) => {
    res.json({
        success: true,
        message: "Logout successful. Please remove the token from the client."
    });
};


module.exports = {
    login,
    logout
};
