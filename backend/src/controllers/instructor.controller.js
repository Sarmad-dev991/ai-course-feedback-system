const db = require("../config/db");

// GET all instructors
const getInstructors = (req, res) => {
    const sql = `
        SELECT
            i.id,
            i.instructor_id,
            i.user_id,
            u.name,
            u.email,
            u.is_active,
            i.created_at
        FROM instructors i
        JOIN users u ON i.user_id = u.id
        ORDER BY i.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch instructors"
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
};


// GET instructor by ID
const getInstructorById = (req, res) => {
    const id = Number(req.params.id);

    const sql = `
        SELECT
            i.id,
            i.instructor_id,
            i.user_id,
            u.name,
            u.email,
            u.is_active,
            i.created_at
        FROM instructors i
        JOIN users u ON i.user_id = u.id
        WHERE i.id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch instructor"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Instructor not found"
            });
        }

        res.json({
            success: true,
            data: results[0]
        });
    });
};


// CREATE instructor
const createInstructor = (req, res) => {
    const { user_id, instructor_id } = req.body;

    if (!user_id || !instructor_id) {
        return res.status(400).json({
            success: false,
            message: "user_id and instructor_id are required"
        });
    }

    db.query(
        "SELECT id, role_id FROM users WHERE id = ?",
        [user_id],
        (userErr, userResults) => {

            if (userErr) {
                console.error(userErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to check user"
                });
            }

            if (userResults.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "User not found"
                });
            }

            db.query(
                `
                SELECT id
                FROM roles
                WHERE id = ?
                AND name = 'Instructor'
                `,
                [userResults[0].role_id],
                (roleErr, roleResults) => {

                    if (roleErr) {
                        console.error(roleErr);
                        return res.status(500).json({
                            success: false,
                            message: "Failed to check user role"
                        });
                    }

                    if (roleResults.length === 0) {
                        return res.status(400).json({
                            success: false,
                            message: "User must have Instructor role"
                        });
                    }

                    db.query(
                        "SELECT id FROM instructors WHERE user_id = ?",
                        [user_id],
                        (duplicateUserErr, duplicateUserResults) => {

                            if (duplicateUserErr) {
                                console.error(duplicateUserErr);
                                return res.status(500).json({
                                    success: false,
                                    message: "Failed to check instructor"
                                });
                            }

                            if (duplicateUserResults.length > 0) {
                                return res.status(409).json({
                                    success: false,
                                    message: "This user is already an instructor"
                                });
                            }

                            db.query(
                                "SELECT id FROM instructors WHERE instructor_id = ?",
                                [instructor_id],
                                (duplicateIdErr, duplicateIdResults) => {

                                    if (duplicateIdErr) {
                                        console.error(duplicateIdErr);
                                        return res.status(500).json({
                                            success: false,
                                            message: "Failed to check instructor ID"
                                        });
                                    }

                                    if (duplicateIdResults.length > 0) {
                                        return res.status(409).json({
                                            success: false,
                                            message: "Instructor ID already exists"
                                        });
                                    }

                                    const sql = `
                                        INSERT INTO instructors
                                        (user_id, instructor_id)
                                        VALUES (?, ?)
                                    `;

                                    db.query(
                                        sql,
                                        [user_id, instructor_id],
                                        (err, result) => {

                                            if (err) {
                                                console.error(err);

                                                return res.status(500).json({
                                                    success: false,
                                                    message: "Failed to create instructor"
                                                });
                                            }

                                            res.status(201).json({
                                                success: true,
                                                message: "Instructor created successfully",
                                                data: {
                                                    id: result.insertId,
                                                    user_id,
                                                    instructor_id
                                                }
                                            });
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};


// UPDATE instructor
const updateInstructor = (req, res) => {
    const id = Number(req.params.id);
    const { user_id, instructor_id } = req.body;

    db.query(
        "SELECT id FROM instructors WHERE id = ?",
        [id],
        (checkErr, checkResults) => {

            if (checkErr) {
                console.error(checkErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to check instructor"
                });
            }

            if (checkResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Instructor not found"
                });
            }

            const sql = `
                UPDATE instructors
                SET
                    user_id = COALESCE(?, user_id),
                    instructor_id = COALESCE(?, instructor_id)
                WHERE id = ?
            `;

            db.query(
                sql,
                [user_id, instructor_id, id],
                (err) => {

                    if (err) {
                        console.error(err);

                        if (err.code === "ER_DUP_ENTRY") {
                            return res.status(409).json({
                                success: false,
                                message: "User or Instructor ID already exists"
                            });
                        }

                        return res.status(500).json({
                            success: false,
                            message: "Failed to update instructor"
                        });
                    }

                    res.json({
                        success: true,
                        message: "Instructor updated successfully"
                    });
                }
            );
        }
    );
};


// DELETE instructor
const deleteInstructor = (req, res) => {
    const id = Number(req.params.id);

    db.query(
        "DELETE FROM instructors WHERE id = ?",
        [id],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to delete instructor"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Instructor not found"
                });
            }

            res.json({
                success: true,
                message: "Instructor deleted successfully"
            });
        }
    );
};


module.exports = {
    getInstructors,
    getInstructorById,
    createInstructor,
    updateInstructor,
    deleteInstructor
};