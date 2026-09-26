const db = require("../config/db");

// GET all feedback forms
const getFeedbackForms = (req, res) => {
    const sql = `
        SELECT
            f.id,
            f.course_id,
            c.title AS course,
            f.batch_id,
            b.name AS batch,
            f.title,
            f.open_date,
            f.close_date,
            f.anonymous_mode,
            f.is_active,
            f.created_at,
            f.updated_at
        FROM feedback_forms f
        JOIN courses c ON f.course_id = c.id
        JOIN batches b ON f.batch_id = b.id
        ORDER BY f.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch feedback forms"
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
};


// GET feedback form by ID
const getFeedbackFormById = (req, res) => {
    const id = Number(req.params.id);

    const sql = `
        SELECT
            f.id,
            f.course_id,
            c.title AS course,
            f.batch_id,
            b.name AS batch,
            f.title,
            f.open_date,
            f.close_date,
            f.anonymous_mode,
            f.is_active,
            f.created_at,
            f.updated_at
        FROM feedback_forms f
        JOIN courses c ON f.course_id = c.id
        JOIN batches b ON f.batch_id = b.id
        WHERE f.id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch feedback form"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Feedback form not found"
            });
        }

        res.json({
            success: true,
            data: results[0]
        });
    });
};


// CREATE feedback form
const createFeedbackForm = (req, res) => {
    const {
        course_id,
        batch_id,
        title,
        open_date,
        close_date,
        anonymous_mode
    } = req.body;

    if (
        !course_id ||
        !batch_id ||
        !title ||
        !open_date ||
        !close_date
    ) {
        return res.status(400).json({
            success: false,
            message: "course_id, batch_id, title, open_date and close_date are required"
        });
    }

    // Check course
    db.query(
        "SELECT id FROM courses WHERE id = ?",
        [course_id],
        (courseErr, courseResults) => {

            if (courseErr) {
                console.error(courseErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to check course"
                });
            }

            if (courseResults.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Course not found"
                });
            }

            // Check batch
            db.query(
                "SELECT id, course_id FROM batches WHERE id = ?",
                [batch_id],
                (batchErr, batchResults) => {

                    if (batchErr) {
                        console.error(batchErr);
                        return res.status(500).json({
                            success: false,
                            message: "Failed to check batch"
                        });
                    }

                    if (batchResults.length === 0) {
                        return res.status(400).json({
                            success: false,
                            message: "Batch not found"
                        });
                    }

                    // Make sure batch belongs to selected course
                    if (Number(batchResults[0].course_id) !== Number(course_id)) {
                        return res.status(400).json({
                            success: false,
                            message: "Selected batch does not belong to selected course"
                        });
                    }

                    const sql = `
                        INSERT INTO feedback_forms
                        (
                            course_id,
                            batch_id,
                            title,
                            open_date,
                            close_date,
                            anonymous_mode
                        )
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;

                    db.query(
                        sql,
                        [
                            course_id,
                            batch_id,
                            title,
                            open_date,
                            close_date,
                            anonymous_mode ?? false
                        ],
                        (err, result) => {

                            if (err) {
                                console.error(err);
                                return res.status(500).json({
                                    success: false,
                                    message: "Failed to create feedback form"
                                });
                            }

                            res.status(201).json({
                                success: true,
                                message: "Feedback form created successfully",
                                data: {
                                    id: result.insertId,
                                    course_id,
                                    batch_id,
                                    title,
                                    open_date,
                                    close_date,
                                    anonymous_mode: anonymous_mode ?? false
                                }
                            });
                        }
                    );
                }
            );
        }
    );
};


// UPDATE feedback form
const updateFeedbackForm = (req, res) => {
    const id = Number(req.params.id);

    const {
        course_id,
        batch_id,
        title,
        open_date,
        close_date,
        anonymous_mode,
        is_active
    } = req.body;

    db.query(
        "SELECT id FROM feedback_forms WHERE id = ?",
        [id],
        (checkErr, checkResults) => {

            if (checkErr) {
                console.error(checkErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to check feedback form"
                });
            }

            if (checkResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Feedback form not found"
                });
            }

            const sql = `
                UPDATE feedback_forms
                SET
                    course_id = COALESCE(?, course_id),
                    batch_id = COALESCE(?, batch_id),
                    title = COALESCE(?, title),
                    open_date = COALESCE(?, open_date),
                    close_date = COALESCE(?, close_date),
                    anonymous_mode = COALESCE(?, anonymous_mode),
                    is_active = COALESCE(?, is_active)
                WHERE id = ?
            `;

            db.query(
                sql,
                [
                    course_id,
                    batch_id,
                    title,
                    open_date,
                    close_date,
                    anonymous_mode,
                    is_active,
                    id
                ],
                (err) => {

                    if (err) {
                        console.error(err);

                        return res.status(500).json({
                            success: false,
                            message: "Failed to update feedback form"
                        });
                    }

                    res.json({
                        success: true,
                        message: "Feedback form updated successfully"
                    });
                }
            );
        }
    );
};


// DELETE feedback form
const deleteFeedbackForm = (req, res) => {
    const id = Number(req.params.id);

    db.query(
        "DELETE FROM feedback_forms WHERE id = ?",
        [id],
        (err, result) => {

            if (err) {
                console.error(err);

                if (err.code === "ER_ROW_IS_REFERENCED_2") {
                    return res.status(409).json({
                        success: false,
                        message: "Cannot delete feedback form because related questions or submissions exist"
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Failed to delete feedback form"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Feedback form not found"
                });
            }

            res.json({
                success: true,
                message: "Feedback form deleted successfully"
            });
        }
    );
};


module.exports = {
    getFeedbackForms,
    getFeedbackFormById,
    createFeedbackForm,
    updateFeedbackForm,
    deleteFeedbackForm
};