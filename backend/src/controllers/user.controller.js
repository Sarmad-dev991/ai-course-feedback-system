const db = require("../config/db");
const bcrypt = require("bcryptjs");


// GET all users

const getUsers = (req, res) => {

    const sql = `
        SELECT
            u.id,
            u.name,
            u.email,
            r.name AS role,
            u.is_active,
            u.created_at,
            u.updated_at
        FROM users u
        JOIN roles r ON u.role_id = r.id
        ORDER BY u.id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch users"
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });

    });
};


// GET user by ID

const getUserById = (req, res) => {

    const id = Number(req.params.id);

    const sql = `
        SELECT
            u.id,
            u.name,
            u.email,
            r.name AS role,
            u.is_active,
            u.created_at,
            u.updated_at
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
    `;

    db.query(sql, [id], (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch user"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            data: results[0]
        });

    });
};


// CREATE user

const createUser = async (req, res) => {

    try {

        const {
            role_id,
            name,
            email,
            password
        } = req.body;


        if (!role_id || !name || !email || !password) {

            return res.status(400).json({
                success: false,
                message: "role_id, name, email and password are required"
            });

        }


        // Check role

        db.query(
            "SELECT id FROM roles WHERE id = ?",
            [role_id],
            async (roleErr, roleResults) => {

                if (roleErr) {
                    console.error(roleErr);

                    return res.status(500).json({
                        success: false,
                        message: "Failed to check role"
                    });
                }

                if (roleResults.length === 0) {

                    return res.status(400).json({
                        success: false,
                        message: "Role not found"
                    });

                }


                // Check duplicate email

                db.query(
                    "SELECT id FROM users WHERE email = ?",
                    [email],
                    async (emailErr, emailResults) => {

                        if (emailErr) {
                            console.error(emailErr);

                            return res.status(500).json({
                                success: false,
                                message: "Failed to check email"
                            });
                        }

                        if (emailResults.length > 0) {

                            return res.status(409).json({
                                success: false,
                                message: "Email already exists"
                            });

                        }


                        // Hash password

                        const passwordHash = await bcrypt.hash(password, 10);


                        const sql = `
                            INSERT INTO users
                            (role_id, name, email, password_hash)
                            VALUES (?, ?, ?, ?)
                        `;

                        db.query(
                            sql,
                            [role_id, name, email, passwordHash],
                            (err, result) => {

                                if (err) {
                                    console.error(err);

                                    return res.status(500).json({
                                        success: false,
                                        message: "Failed to create user"
                                    });
                                }

                                res.status(201).json({
                                    success: true,
                                    message: "User created successfully",
                                    data: {
                                        id: result.insertId,
                                        role_id,
                                        name,
                                        email
                                    }
                                });

                            }
                        );

                    }
                );

            }
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

};


// UPDATE user

const updateUser = async (req, res) => {

    try {

        const id = Number(req.params.id);

        const {
            role_id,
            name,
            email,
            password,
            is_active
        } = req.body;


        const checkSql = `
            SELECT id
            FROM users
            WHERE id = ?
        `;

        db.query(checkSql, [id], async (checkErr, checkResults) => {

            if (checkErr) {
                console.error(checkErr);

                return res.status(500).json({
                    success: false,
                    message: "Failed to check user"
                });
            }

            if (checkResults.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });

            }


            let passwordHash = null;

            if (password) {
                passwordHash = await bcrypt.hash(password, 10);
            }


            const sql = `
                UPDATE users
                SET
                    role_id = COALESCE(?, role_id),
                    name = COALESCE(?, name),
                    email = COALESCE(?, email),
                    password_hash = COALESCE(?, password_hash),
                    is_active = COALESCE(?, is_active)
                WHERE id = ?
            `;

            db.query(
                sql,
                [
                    role_id,
                    name,
                    email,
                    passwordHash,
                    is_active,
                    id
                ],
                (err) => {

                    if (err) {
                        console.error(err);

                        if (err.code === "ER_DUP_ENTRY") {
                            return res.status(409).json({
                                success: false,
                                message: "Email already exists"
                            });
                        }

                        return res.status(500).json({
                            success: false,
                            message: "Failed to update user"
                        });
                    }

                    res.json({
                        success: true,
                        message: "User updated successfully"
                    });

                }
            );

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

};


// DELETE user

const deleteUser = (req, res) => {

    const id = Number(req.params.id);

    const sql = `
        DELETE FROM users
        WHERE id = ?
    `;

    db.query(sql, [id], (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to delete user"
            });
        }

        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

        res.json({
            success: true,
            message: "User deleted successfully"
        });

    });

};



// Get the currently logged-in user's profile
const getMyProfile = async (req, res) => {
    try {
        db.query(
            `SELECT 
                u.id,
                u.name,
                u.email,
                u.is_active,
                u.created_at,
                r.name AS role,
                s.student_id
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             LEFT JOIN students s ON s.user_id = u.id
             WHERE u.id = ?`,
            [req.user.userId],
            (error, results) => {
                if (error) {
                    console.error("Profile database error:", error.message);

                    return res.status(500).json({
                        success: false,
                        message: "Unable to load profile."
                    });
                }

                if (results.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "User not found."
                    });
                }

                return res.status(200).json({
                    success: true,
                    user: results[0]
                });
            }
        );
    } catch (error) {
        console.error("getMyProfile error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to load profile."
        });
    }
};


// Update the currently logged-in user's own name/email
const updateMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, email } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            !name.trim() ||
            !email.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required."
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (cleanName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Name must be 100 characters or fewer."
            });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        const [existing] = await db.query(
            "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1",
            [cleanEmail, userId]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This email is already in use."
            });
        }

        const [result] = await db.query(
            `UPDATE users
             SET name = ?, email = ?
             WHERE id = ?`,
            [cleanName, cleanEmail, userId]
        );

        if (result.affectedRows === 0) {
            const [check] = await db.query(
                "SELECT id FROM users WHERE id = ? LIMIT 1",
                [userId]
            );

            if (check.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User profile not found."
                });
            }
        }

        const [rows] = await db.query(
            `SELECT
                u.id,
                u.name,
                u.email,
                r.name AS role,
                u.is_active,
                u.created_at,
                u.updated_at,
                s.student_id
             FROM users u
             JOIN roles r ON r.id = u.role_id
             LEFT JOIN students s ON s.user_id = u.id
             WHERE u.id = ?
             LIMIT 1`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            user: rows[0]
        });
    } catch (error) {
        console.error("Update my profile error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "This email is already in use."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update profile."
        });
    }
};



module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getMyProfile,
    updateMyProfile
};
