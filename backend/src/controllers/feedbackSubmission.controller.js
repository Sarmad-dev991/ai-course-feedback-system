const db = require("../config/db");

// GET ALL SUBMISSIONS
const getFeedbackSubmissions = (req, res) => {
    const sql = `
        SELECT
            fs.id,
            fs.form_id,
            f.title AS form,
            fs.student_id,
            u.name AS student_name,
            fs.submitted_at,
            fs.status
        FROM feedback_submissions fs
        JOIN feedback_forms f
            ON fs.form_id = f.id
        JOIN students s
            ON fs.student_id = s.id
        JOIN users u
            ON s.user_id = u.id
        ORDER BY fs.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch feedback submissions"
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
};


// GET SUBMISSION BY ID
const getFeedbackSubmissionById = (req, res) => {
    const id = Number(req.params.id);

    const sql = `
        SELECT
            fs.id,
            fs.form_id,
            f.title AS form,
            fs.student_id,
            u.name AS student_name,
            fs.submitted_at,
            fs.status
        FROM feedback_submissions fs
        JOIN feedback_forms f
            ON fs.form_id = f.id
        JOIN students s
            ON fs.student_id = s.id
        JOIN users u
            ON s.user_id = u.id
        WHERE fs.id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch feedback submission"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Feedback submission not found"
            });
        }

        res.json({
            success: true,
            data: results[0]
        });
    });
};


// CREATE SUBMISSION
const createFeedbackSubmission = (req, res) => {
    const {
        form_id,
        student_id
    } = req.body;

    if (!form_id || !student_id) {
        return res.status(400).json({
            success: false,
            message: "form_id and student_id are required"
        });
    }

    // Check form
    const formSql = `
        SELECT
            id,
            course_id,
            batch_id,
            open_date,
            close_date,
            is_active
        FROM feedback_forms
        WHERE id = ?
    `;

    db.query(formSql, [form_id], (formErr, formResults) => {
        if (formErr) {
            console.error(formErr);
            return res.status(500).json({
                success: false,
                message: "Failed to check feedback form"
            });
        }

        if (formResults.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Feedback form not found"
            });
        }

        const form = formResults[0];

        if (!form.is_active) {
            return res.status(400).json({
                success: false,
                message: "Feedback form is not active"
            });
        }

        // Check date window
        const now = new Date();

        if (now < new Date(form.open_date)) {
            return res.status(400).json({
                success: false,
                message: "Feedback form is not open yet"
            });
        }

        if (now > new Date(form.close_date)) {
            return res.status(400).json({
                success: false,
                message: "Feedback form is closed"
            });
        }

        // Check student
        db.query(
            "SELECT id FROM students WHERE id = ?",
            [student_id],
            (studentErr, studentResults) => {
                if (studentErr) {
                    console.error(studentErr);
                    return res.status(500).json({
                        success: false,
                        message: "Failed to check student"
                    });
                }

                if (studentResults.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Student not found"
                    });
                }

                // Check enrollment
                const enrollmentSql = `
                    SELECT id
                    FROM enrollments
                    WHERE student_id = ?
                    AND batch_id = ?
                `;

                db.query(
                    enrollmentSql,
                    [student_id, form.batch_id],
                    (enrollmentErr, enrollmentResults) => {
                        if (enrollmentErr) {
                            console.error(enrollmentErr);
                            return res.status(500).json({
                                success: false,
                                message: "Failed to check student enrollment"
                            });
                        }

                        if (enrollmentResults.length === 0) {
                            return res.status(403).json({
                                success: false,
                                message: "Student is not enrolled in this course batch"
                            });
                        }

                        // Check duplicate submission
                        const duplicateSql = `
                            SELECT id
                            FROM feedback_submissions
                            WHERE form_id = ?
                            AND student_id = ?
                        `;

                        db.query(
                            duplicateSql,
                            [form_id, student_id],
                            (duplicateErr, duplicateResults) => {
                                if (duplicateErr) {
                                    console.error(duplicateErr);
                                    return res.status(500).json({
                                        success: false,
                                        message: "Failed to check existing submission"
                                    });
                                }

                                if (duplicateResults.length > 0) {
                                    return res.status(409).json({
                                        success: false,
                                        message: "Student has already submitted this feedback form"
                                    });
                                }

                                // Create submission
                                const insertSql = `
                                    INSERT INTO feedback_submissions
                                    (
                                        form_id,
                                        student_id,
                                        status
                                    )
                                    VALUES (?, ?, 'submitted')
                                `;

                                db.query(
                                    insertSql,
                                    [form_id, student_id],
                                    (insertErr, result) => {
                                        if (insertErr) {
                                            console.error(insertErr);
                                            return res.status(500).json({
                                                success: false,
                                                message: "Failed to create feedback submission"
                                            });
                                        }

                                        res.status(201).json({
                                            success: true,
                                            message: "Feedback submission created successfully",
                                            data: {
                                                id: result.insertId,
                                                form_id,
                                                student_id,
                                                status: "submitted"
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
    });
};


// UPDATE SUBMISSION
const updateFeedbackSubmission = (req, res) => {
    const id = Number(req.params.id);

    const {
        form_id,
        student_id,
        status
    } = req.body;

    db.query(
        "SELECT id FROM feedback_submissions WHERE id = ?",
        [id],
        (checkErr, checkResults) => {
            if (checkErr) {
                console.error(checkErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to check feedback submission"
                });
            }

            if (checkResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Feedback submission not found"
                });
            }

            const sql = `
                UPDATE feedback_submissions
                SET
                    form_id = COALESCE(?, form_id),
                    student_id = COALESCE(?, student_id),
                    status = COALESCE(?, status)
                WHERE id = ?
            `;

            db.query(
                sql,
                [
                    form_id,
                    student_id,
                    status,
                    id
                ],
                (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            success: false,
                            message: "Failed to update feedback submission"
                        });
                    }

                    res.json({
                        success: true,
                        message: "Feedback submission updated successfully"
                    });
                }
            );
        }
    );
};


// DELETE SUBMISSION
const deleteFeedbackSubmission = (req, res) => {
    const id = Number(req.params.id);

    db.query(
        "DELETE FROM feedback_submissions WHERE id = ?",
        [id],
        (err, result) => {
            if (err) {
                console.error(err);

                if (err.code === "ER_ROW_IS_REFERENCED_2") {
                    return res.status(409).json({
                        success: false,
                        message: "Cannot delete submission because related responses exist"
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Failed to delete feedback submission"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Feedback submission not found"
                });
            }

            res.json({
                success: true,
                message: "Feedback submission deleted successfully"
            });
        }
    );
};


module.exports = {
    getFeedbackSubmissions,
    getFeedbackSubmissionById,
    createFeedbackSubmission,
    updateFeedbackSubmission,
    deleteFeedbackSubmission
};