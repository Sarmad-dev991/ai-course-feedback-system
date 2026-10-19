const db = require("../config/db");

// GET ALL SUBMISSIONS
const getFeedbackSubmissions = (req, res) => {
    const sql = `
        SELECT
            fs.id,
            fs.form_id,
            fs.student_id,
            f.title AS form,
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

    const submission = results[0];

    if (req.user?.role === "Student") {
        const loggedInStudentId = Number(req.user.studentId);

        if (
            !loggedInStudentId ||
            Number(submission.student_id) !== loggedInStudentId
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to view this feedback submission"
            });
        }
    } else if (!["Admin", "Instructor"].includes(req.user?.role)) {
        return res.status(403).json({
            success: false,
            message: "You are not allowed to view this feedback submission"
        });
    }

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
            f.course_id,
            c.title AS course_name,
            f.batch_id,
            b.name AS batch_name,
            fs.student_id,
            u.name AS student_name,
            instructor_user.name AS instructor_name,
            fs.submitted_at,
            fs.status
        FROM feedback_submissions fs
        JOIN feedback_forms f
            ON fs.form_id = f.id
        LEFT JOIN courses c
            ON f.course_id = c.id
        LEFT JOIN batches b
            ON f.batch_id = b.id
        JOIN students s
            ON fs.student_id = s.id
        JOIN users u
            ON s.user_id = u.id
        LEFT JOIN batch_instructors bi
            ON bi.batch_id = f.batch_id
        LEFT JOIN instructors i
            ON bi.instructor_id = i.id
        LEFT JOIN users instructor_user
            ON i.user_id = instructor_user.id
        WHERE fs.id = ?
        LIMIT 1
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Get submission by ID error:", err);
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

        return res.status(200).json({
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



const completeFeedbackSubmission = async (req, res) => {
    const { form_id, ratings, complaint, suggestion } = req.body;
    const connection = db.promise();

    let student_id;

    if (req.user?.role === "Student") {
        // Student ID token se aayegi, request body se nahi
        student_id = Number(req.user.studentId);

        if (!student_id || !Number.isInteger(student_id)) {
            return res.status(403).json({
                success: false,
                message: "Student profile not found in your login session. Please log in again."
            });
        }
    } else if (req.user?.role === "Admin") {
        // Admin ke liye supplied student ID allow hai
        student_id = Number(req.body.student_id);

        if (!student_id || !Number.isInteger(student_id)) {
            return res.status(400).json({
                success: false,
                message: "A valid student_id is required"
            });
        }
    } else {
        return res.status(403).json({
            success: false,
            message: "You are not allowed to submit feedback"
        });
    }

    if (!form_id || !student_id || !Array.isArray(ratings)) {
        return res.status(400).json({
            success: false,
            message: "form_id, student_id and ratings are required"
        });
    }

    if (
        ratings.length !== 18 ||
        ratings.some(r => !r.question_id || !r.option_id) ||
        new Set(ratings.map(r => Number(r.question_id))).size !== 18
    ) {
        return res.status(400).json({
            success: false,
            message: "Exactly 18 unique rating answers are required"
        });
    }

    let transactionStarted = false;

    try {
        await connection.beginTransaction();
        transactionStarted = true;

        // Check form
        const [forms] = await connection.query(
            `SELECT id, batch_id, open_date, close_date, is_active
             FROM feedback_forms
             WHERE id = ?`,
            [form_id]
        );

        if (!forms.length) {
            throw Object.assign(new Error("Feedback form not found"), {
                status: 400
            });
        }

        const form = forms[0];
        const now = new Date();

        if (Number(form.is_active) !== 1) {
            throw Object.assign(new Error("Feedback form is not active"), {
                status: 400
            });
        }

        if (now < new Date(form.open_date) || now > new Date(form.close_date)) {
            throw Object.assign(new Error("Feedback form is not currently open"), {
                status: 400
            });
        }

        // Check student
        const [students] = await connection.query(
            "SELECT id FROM students WHERE id = ?",
            [student_id]
        );

        if (!students.length) {
            throw Object.assign(new Error("Student not found"), {
                status: 400
            });
        }

        // Check enrollment
        const [enrollments] = await connection.query(
            `SELECT id FROM enrollments
             WHERE student_id = ? AND batch_id = ?`,
            [student_id, form.batch_id]
        );

        if (!enrollments.length) {
            throw Object.assign(
                new Error("Student is not enrolled in this batch"),
                { status: 403 }
            );
        }

        // Find existing submission and lock it during recovery
        const [existing] = await connection.query(
            `SELECT id
             FROM feedback_submissions
             WHERE form_id = ? AND student_id = ?
             FOR UPDATE`,
            [form_id, student_id]
        );

        let submissionId;
        let isRecovery = false;

        if (existing.length) {
            submissionId = existing[0].id;

            const [saved] = await connection.query(
                `SELECT COUNT(*) AS total
                 FROM rating_responses
                 WHERE submission_id = ?`,
                [submissionId]
            );

            const savedRatings = Number(saved[0].total);

            if (savedRatings === 18) {
                throw Object.assign(
                    new Error("This student has already submitted this form"),
                    { status: 409 }
                );
            }

            if (savedRatings !== 0) {
                throw Object.assign(
                    new Error(
                        "This submission has partial ratings and needs admin review"
                    ),
                    { status: 409 }
                );
            }

            // Recover the existing submission instead of creating a duplicate
            isRecovery = true;
        }

        // Validate all 18 questions (correct table name)
        const questionIds = ratings.map(r => Number(r.question_id));

        const [questions] = await connection.query(
            `SELECT id
             FROM feedback_questions
             WHERE id IN (?) AND question_type = 'rating'`,
            [questionIds]
        );

        if (questions.length !== 18) {
            throw Object.assign(
                new Error("One or more rating questions are invalid"),
                { status: 400 }
            );
        }

        // Validate each option belongs to its question
        for (const rating of ratings) {
            const [options] = await connection.query(
                `SELECT id
                 FROM feedback_options
                 WHERE id = ? AND question_id = ?`,
                [rating.option_id, rating.question_id]
            );

            if (!options.length) {
                throw Object.assign(
                    new Error(`Invalid option for question ${rating.question_id}`),
                    { status: 400 }
                );
            }
        }

        // Create a submission only if one does not already exist
        if (!isRecovery) {
            const [result] = await connection.query(
                `INSERT INTO feedback_submissions
                 (form_id, student_id, status)
                 VALUES (?, ?, 'submitted')`,
                [form_id, student_id]
            );

            submissionId = result.insertId;
        }

        // Save all 18 ratings
        for (const rating of ratings) {
            await connection.query(
                `INSERT INTO rating_responses
                 (submission_id, question_id, option_id)
                 VALUES (?, ?, ?)`,
                [submissionId, rating.question_id, rating.option_id]
            );
        }
        // Save, update, or remove optional comments
        for (const [responseType, responseText] of [
            ["complaint", complaint],
            ["suggestion", suggestion]
        ]) {
            const cleanText =
                typeof responseText === "string"
                    ? responseText.trim()
                    : "";

            const [existingText] = await connection.query(
                `SELECT id
                 FROM text_responses
                 WHERE submission_id = ?
                   AND response_type = ?
                 LIMIT 1`,
                [submissionId, responseType]
            );

            if (!cleanText) {
                // If the field is empty, remove any old saved value
                if (existingText.length) {
                    await connection.query(
                        `DELETE FROM text_responses
                         WHERE id = ?`,
                        [existingText[0].id]
                    );
                }

                continue;
            }

            if (existingText.length) {
                await connection.query(
                    `UPDATE text_responses
                     SET response_text = ?
                     WHERE id = ?`,
                    [cleanText, existingText[0].id]
                );
            } else {
                await connection.query(
                    `INSERT INTO text_responses
                     (submission_id, response_type, response_text)
                     VALUES (?, ?, ?)`,
                    [submissionId, responseType, cleanText]
                );
            }
        }


        await connection.commit();
        transactionStarted = false;

        return res.status(isRecovery ? 200 : 201).json({
            success: true,
            message: isRecovery
                ? "Existing feedback submission completed successfully"
                : "Feedback and all responses saved successfully",
            data: {
                id: submissionId,
                ratings_saved: 18
            }
        });

    } catch (error) {
        if (transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Rollback failed:", rollbackError);
            }
        }

        console.error("Complete feedback submission error:", error);

        return res.status(error.status || 500).json({
            success: false,
            message: error.status
                ? error.message
                : "Failed to save complete feedback"
        });
    }
};


module.exports = {
    getFeedbackSubmissions,
    getFeedbackSubmissionById,
    createFeedbackSubmission,
    completeFeedbackSubmission,
    updateFeedbackSubmission,
    deleteFeedbackSubmission
};