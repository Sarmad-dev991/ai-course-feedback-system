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


module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};