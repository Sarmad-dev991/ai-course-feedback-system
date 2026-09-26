const db = require("../config/db");

// GET ALL TEXT RESPONSES
const getTextResponses = (req, res) => {
    const sql = `
        SELECT
            tr.id,
            tr.submission_id,
            tr.response_type,
            tr.response_text
        FROM text_responses tr
        ORDER BY tr.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch text responses"
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
};


// GET TEXT RESPONSE BY ID
const getTextResponseById = (req, res) => {
    const id = Number(req.params.id);

    const sql = `
        SELECT
            tr.id,
            tr.submission_id,
            tr.response_type,
            tr.response_text
        FROM text_responses tr
        WHERE tr.id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch text response"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Text response not found"
            });
        }

        res.json({
            success: true,
            data: results[0]
        });
    });
};


// CREATE TEXT RESPONSE
const createTextResponse = (req, res) => {
    const {
        submission_id,
        response_type,
        response_text
    } = req.body;

    if (!submission_id || !response_type) {
        return res.status(400).json({
            success: false,
            message: "submission_id and response_type are required"
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

            // Check duplicate response type
            db.query(
                `SELECT id
                 FROM text_responses
                 WHERE submission_id = ?
                 AND response_type = ?`,
                [submission_id, response_type],
                (duplicateErr, duplicateResults) => {
                    if (duplicateErr) {
                        console.error(duplicateErr);
                        return res.status(500).json({
                            success: false,
                            message: "Failed to check existing text response"
                        });
                    }

                    if (duplicateResults.length > 0) {
                        return res.status(409).json({
                            success: false,
                            message: "This response type already exists for this submission"
                        });
                    }

                    const sql = `
                        INSERT INTO text_responses
                        (
                            submission_id,
                            response_type,
                            response_text
                        )
                        VALUES (?, ?, ?)
                    `;

                    db.query(
                        sql,
                        [
                            submission_id,
                            response_type,
                            response_text || null
                        ],
                        (err, result) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({
                                    success: false,
                                    message: "Failed to create text response"
                                });
                            }

                            res.status(201).json({
                                success: true,
                                message: "Text response created successfully",
                                data: {
                                    id: result.insertId,
                                    submission_id,
                                    response_type,
                                    response_text: response_text || null
                                }
                            });
                        }
                    );
                }
            );
        }
    );
};


// UPDATE TEXT RESPONSE
const updateTextResponse = (req, res) => {
    const id = Number(req.params.id);

    const {
        response_type,
        response_text
    } = req.body;

    db.query(
        "SELECT id FROM text_responses WHERE id = ?",
        [id],
        (checkErr, checkResults) => {
            if (checkErr) {
                console.error(checkErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to check text response"
                });
            }

            if (checkResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Text response not found"
                });
            }

            const sql = `
                UPDATE text_responses
                SET
                    response_type = COALESCE(?, response_type),
                    response_text = COALESCE(?, response_text)
                WHERE id = ?
            `;

            db.query(
                sql,
                [
                    response_type,
                    response_text,
                    id
                ],
                (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            success: false,
                            message: "Failed to update text response"
                        });
                    }

                    res.json({
                        success: true,
                        message: "Text response updated successfully"
                    });
                }
            );
        }
    );
};


// DELETE TEXT RESPONSE
const deleteTextResponse = (req, res) => {
    const id = Number(req.params.id);

    db.query(
        "DELETE FROM text_responses WHERE id = ?",
        [id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to delete text response"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Text response not found"
                });
            }

            res.json({
                success: true,
                message: "Text response deleted successfully"
            });
        }
    );
};


module.exports = {
    getTextResponses,
    getTextResponseById,
    createTextResponse,
    updateTextResponse,
    deleteTextResponse
};