const db = require("../config/db");

// =========================
// GET ALL OPTIONS
// =========================
const getFeedbackOptions = (req, res) => {

    const sql = `
        SELECT
            o.id,
            o.question_id,
            q.question_text,
            o.option_text,
            o.option_value
        FROM feedback_options o
        JOIN feedback_questions q
            ON o.question_id = q.id
        ORDER BY o.question_id, o.id
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch feedback options"
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
};


// =========================
// GET OPTION BY ID
// =========================
const getFeedbackOptionById = (req, res) => {

    const id = Number(req.params.id);

    const sql = `
        SELECT
            o.id,
            o.question_id,
            q.question_text,
            o.option_text,
            o.option_value
        FROM feedback_options o
        JOIN feedback_questions q
            ON o.question_id = q.id
        WHERE o.id = ?
    `;

    db.query(sql, [id], (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch feedback option"
            });
        }

        if (results.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Feedback option not found"
            });
        }

        res.json({
            success: true,
            data: results[0]
        });
    });
};


// =========================
// CREATE OPTION
// =========================
const createFeedbackOption = (req, res) => {

    const {
        question_id,
        option_text,
        option_value
    } = req.body;

    if (!question_id || !option_text) {

        return res.status(400).json({
            success: false,
            message: "question_id and option_text are required"
        });
    }

    // Check question
    db.query(
        "SELECT id FROM feedback_questions WHERE id = ?",
        [question_id],
        (questionErr, questionResults) => {

            if (questionErr) {
                console.error(questionErr);

                return res.status(500).json({
                    success: false,
                    message: "Failed to check question"
                });
            }

            if (questionResults.length === 0) {

                return res.status(400).json({
                    success: false,
                    message: "Question not found"
                });
            }

            const sql = `
                INSERT INTO feedback_options
                (
                    question_id,
                    option_text,
                    option_value
                )
                VALUES (?, ?, ?)
            `;

            db.query(
                sql,
                [
                    question_id,
                    option_text,
                    option_value ?? null
                ],
                (err, result) => {

                    if (err) {
                        console.error(err);

                        return res.status(500).json({
                            success: false,
                            message: "Failed to create feedback option"
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: "Feedback option created successfully",
                        data: {
                            id: result.insertId,
                            question_id,
                            option_text,
                            option_value: option_value ?? null
                        }
                    });
                }
            );
        }
    );
};


// =========================
// UPDATE OPTION
// =========================
const updateFeedbackOption = (req, res) => {

    const id = Number(req.params.id);

    const {
        question_id,
        option_text,
        option_value
    } = req.body;

    db.query(
        "SELECT id FROM feedback_options WHERE id = ?",
        [id],
        (checkErr, checkResults) => {

            if (checkErr) {
                console.error(checkErr);

                return res.status(500).json({
                    success: false,
                    message: "Failed to check feedback option"
                });
            }

            if (checkResults.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Feedback option not found"
                });
            }

            const sql = `
                UPDATE feedback_options
                SET
                    question_id = COALESCE(?, question_id),
                    option_text = COALESCE(?, option_text),
                    option_value = COALESCE(?, option_value)
                WHERE id = ?
            `;

            db.query(
                sql,
                [
                    question_id,
                    option_text,
                    option_value,
                    id
                ],
                (err) => {

                    if (err) {
                        console.error(err);

                        return res.status(500).json({
                            success: false,
                            message: "Failed to update feedback option"
                        });
                    }

                    res.json({
                        success: true,
                        message: "Feedback option updated successfully"
                    });
                }
            );
        }
    );
};


// =========================
// DELETE OPTION
// =========================
const deleteFeedbackOption = (req, res) => {

    const id = Number(req.params.id);

    db.query(
        "DELETE FROM feedback_options WHERE id = ?",
        [id],
        (err, result) => {

            if (err) {
                console.error(err);

                if (err.code === "ER_ROW_IS_REFERENCED_2") {

                    return res.status(409).json({
                        success: false,
                        message: "Cannot delete option because related rating responses exist"
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Failed to delete feedback option"
                });
            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Feedback option not found"
                });
            }

            res.json({
                success: true,
                message: "Feedback option deleted successfully"
            });
        }
    );
};


module.exports = {
    getFeedbackOptions,
    getFeedbackOptionById,
    createFeedbackOption,
    updateFeedbackOption,
    deleteFeedbackOption
};