const db = require("../config/db");

// GET all students
const getStudents = (req, res) => {
    const sql = `
        SELECT
            s.id,
            s.student_id,
            s.user_id,
            u.name,
            u.email,
            u.is_active,
            s.created_at
        FROM students s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch students"
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
};


// GET student by ID
const getStudentById = (req, res) => {
    const id = Number(req.params.id);

    const sql = `
        SELECT
            s.id,
            s.student_id,
            s.user_id,
            u.name,
            u.email,
            u.is_active,
            s.created_at
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch student"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.json({
            success: true,
            data: results[0]
        });
    });
};


// CREATE student
const createStudent = (req, res) => {
    const { user_id, student_id } = req.body;

    if (!user_id || !student_id) {
        return res.status(400).json({
            success: false,
            message: "user_id and student_id are required"
        });
    }

    // Check user exists
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

            // Check Student role
            db.query(
                `
                SELECT id
                FROM roles
                WHERE id = ?
                AND name = 'Student'
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
                            message: "User must have Student role"
                        });
                    }

                    // Check duplicate user_id
                    db.query(
                        "SELECT id FROM students WHERE user_id = ?",
                        [user_id],
                        (duplicateUserErr, duplicateUserResults) => {

                            if (duplicateUserErr) {
                                console.error(duplicateUserErr);
                                return res.status(500).json({
                                    success: false,
                                    message: "Failed to check student"
                                });
                            }

                            if (duplicateUserResults.length > 0) {
                                return res.status(409).json({
                                    success: false,
                                    message: "This user is already a student"
                                });
                            }

                            // Check duplicate student_id
                            db.query(
                                "SELECT id FROM students WHERE student_id = ?",
                                [student_id],
                                (duplicateIdErr, duplicateIdResults) => {

                                    if (duplicateIdErr) {
                                        console.error(duplicateIdErr);
                                        return res.status(500).json({
                                            success: false,
                                            message: "Failed to check student ID"
                                        });
                                    }

                                    if (duplicateIdResults.length > 0) {
                                        return res.status(409).json({
                                            success: false,
                                            message: "Student ID already exists"
                                        });
                                    }

                                    const sql = `
                                        INSERT INTO students
                                        (user_id, student_id)
                                        VALUES (?, ?)
                                    `;

                                    db.query(
                                        sql,
                                        [user_id, student_id],
                                        (err, result) => {

                                            if (err) {
                                                console.error(err);

                                                return res.status(500).json({
                                                    success: false,
                                                    message: "Failed to create student"
                                                });
                                            }

                                            res.status(201).json({
                                                success: true,
                                                message: "Student created successfully",
                                                data: {
                                                    id: result.insertId,
                                                    user_id,
                                                    student_id
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


// UPDATE student
const updateStudent = (req, res) => {
    const id = Number(req.params.id);
    const { user_id, student_id } = req.body;

    const checkSql = `
        SELECT id
        FROM students
        WHERE id = ?
    `;

    db.query(checkSql, [id], (checkErr, checkResults) => {

        if (checkErr) {
            console.error(checkErr);
            return res.status(500).json({
                success: false,
                message: "Failed to check student"
            });
        }

        if (checkResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const sql = `
            UPDATE students
            SET
                user_id = COALESCE(?, user_id),
                student_id = COALESCE(?, student_id)
            WHERE id = ?
        `;

        db.query(
            sql,
            [user_id, student_id, id],
            (err, result) => {

                if (err) {
                    console.error(err);

                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(409).json({
                            success: false,
                            message: "User or Student ID already exists"
                        });
                    }

                    return res.status(500).json({
                        success: false,
                        message: "Failed to update student"
                    });
                }

                res.json({
                    success: true,
                    message: "Student updated successfully"
                });
            }
        );
    });
};


// DELETE student
const deleteStudent = (req, res) => {
    const id = Number(req.params.id);

    const sql = `
        DELETE FROM students
        WHERE id = ?
    `;

    db.query(sql, [id], (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to delete student"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.json({
            success: true,
            message: "Student deleted successfully"
        });
    });
};


module.exports = {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
};