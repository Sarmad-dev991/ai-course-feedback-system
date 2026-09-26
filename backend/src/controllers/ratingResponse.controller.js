const db = require("../config/db");

// GET ALL RATING RESPONSES
const getRatingResponses = (req, res) => {
    const sql = `
        SELECT
            rr.id,
            rr.submission_id,
            rr.question_id,
            q.question_text,
            rr.option_id,
            o.option_text,
            o.option_value
        FROM rating_responses rr
        JOIN feedback_questions q
            ON rr.question_id = q.id
        JOIN feedback_options o
            ON rr.option_id = o.id
        ORDER BY rr.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch rating responses"
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
};


// GET RATING RESPONSE BY ID
const getRatingResponseById = (req, res) => {
    const id = Number(req.params.id);

    const sql = `
        SELECT
            rr.id,
            rr.submission_id,
            rr.question_id,
            q.question_text,
            rr.option_id,
            o.option_text,
            o.option_value
        FROM rating_responses rr
        JOIN feedback_questions q
            ON rr.question_id = q.id
        JOIN feedback_options o
            ON rr.option_id = o.id
        WHERE rr.id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch rating response"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Rating response not found"
            });
        }

        res.json({
            success: true,
            data: results[0]
        });
    });
};


// CREATE RATING RESPONSE
const createRatingResponse = (req, res) => {
    const {
        submission_id,
        question_id,
        option_id
    } = req.body;

    if (!submission_id || !question_id || !option_id) {
        return res.status(400).json({
            success: false,
            message: "submission_id, question_id and option_id are required"
        });
    }

    // Check submission
    db.query(
        "SELECT id FROM feedback_submissions WHERE id = ?",
        [submission_id],
        (submissionErr, submissionResults) => {
            if (submissionErr) {
                console.error(submissionErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to check submission"
                });
            }

            if (submissionResults.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Feedback submission not found"
                });
            }

            // Check question
            db.query(
                `SELECT id, question_type
                 FROM feedback_questions
                 WHERE id = ?`,
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

                    const question = questionResults[0];

                    if (question.question_type !== "rating") {
                        return res.status(400).json({
                            success: false,
                            message: "This question does not accept a rating response"
                        });
                    }

                    // Check option belongs to question
                    db.query(
                        `SELECT id
                         FROM feedback_options
                         WHERE id = ?
                         AND question_id = ?`,
                        [option_id, question_id],
                        (optionErr, optionResults) => {
                            if (optionErr) {
                                console.error(optionErr);
                                return res.status(500).json({
                                    success: false,
                                    message: "Failed to check option"
                                });
                            }

                            if (optionResults.length === 0) {
                                return res.status(400).json({
                                    success: false,
                                    message: "Selected option does not belong to this question"
                                });
                            }

                            // Check duplicate response
                            db.query(
                                `SELECT id
                                 FROM rating_responses
                                 WHERE submission_id = ?
                                 AND question_id = ?`,
                                [submission_id, question_id],
                                (duplicateErr, duplicateResults) => {
                                    if (duplicateErr) {
                                        console.error(duplicateErr);
                                        return res.status(500).json({
                                            success: false,
                                            message: "Failed to check existing response"
                                        });
                                    }

                                    if (duplicateResults.length > 0) {
                                        return res.status(409).json({
                                            success: false,
                                            message: "Rating response already exists for this question"
                                        });
                                    }

                                    // Insert response
                                    const sql = `
                                        INSERT INTO rating_responses
                                        (
                                            submission_id,
                                            question_id,
                                            option_id
                                        )
                                        VALUES (?, ?, ?)
                                    `;

                                    db.query(
                                        sql,
                                        [
                                            submission_id,
                                            question_id,
                                            option_id
                                        ],
                                        (err, result) => {
                                            if (err) {
                                                console.error(err);
                                                return res.status(500).json({
                                                    success: false,
                                                    message: "Failed to create rating response"
                                                });
                                            }

                                            res.status(201).json({
                                                success: true,
                                                message: "Rating response created successfully",
                                                data: {
                                                    id: result.insertId,
                                                    submission_id,
                                                    question_id,
                                                    option_id
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


// UPDATE RATING RESPONSE
const updateRatingResponse = (req, res) => {
    const id = Number(req.params.id);

    const {
        question_id,
        option_id
    } = req.body;

    db.query(
        "SELECT id FROM rating_responses WHERE id = ?",
        [id],
        (checkErr, checkResults) => {
            if (checkErr) {
                console.error(checkErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to check rating response"
                });
            }

            if (checkResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Rating response not found"
                });
            }

            const sql = `
                UPDATE rating_responses
                SET
                    question_id = COALESCE(?, question_id),
                    option_id = COALESCE(?, option_id)
                WHERE id = ?
            `;

            db.query(
                sql,
                [
                    question_id,
                    option_id,
                    id
                ],
                (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            success: false,
                            message: "Failed to update rating response"
                        });
                    }

                    res.json({
                        success: true,
                        message: "Rating response updated successfully"
                    });
                }
            );
        }
    );
};


// DELETE RATING RESPONSE
const deleteRatingResponse = (req, res) => {
    const id = Number(req.params.id);

    db.query(
        "DELETE FROM rating_responses WHERE id = ?",
        [id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to delete rating response"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Rating response not found"
                });
            }

            res.json({
                success: true,
                message: "Rating response deleted successfully"
            });
        }
    );
};


module.exports = {
    getRatingResponses,
    getRatingResponseById,
    createRatingResponse,
    updateRatingResponse,
    deleteRatingResponse
};