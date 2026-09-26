const db = require("../config/db");

// =========================
// GET ALL QUESTIONS
// =========================
const getQuestions = (req, res) => {

    const sql = `
        SELECT
            q.id,
            q.form_id,
            f.title AS form,
            q.section,
            q.question_text,
            q.question_type,
            q.is_required,
            q.question_order
        FROM feedback_questions q
        JOIN feedback_forms f ON q.form_id = f.id
        ORDER BY q.form_id, q.question_order
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch questions"
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
// GET QUESTION BY ID
// =========================
const getQuestionById = (req, res) => {

    const id = Number(req.params.id);

    const sql = `
        SELECT
            q.id,
            q.form_id,
            f.title AS form,
            q.section,
            q.question_text,
            q.question_type,
            q.is_required,
            q.question_order
        FROM feedback_questions q
        JOIN feedback_forms f ON q.form_id = f.id
        WHERE q.id = ?
    `;

    db.query(sql, [id], (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch question"
            });
        }

        if (results.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Question not found"
            });
        }

        res.json({
            success: true,
            data: results[0]
        });
    });
};


// =========================
// CREATE QUESTION
// =========================
const createQuestion = (req, res) => {

    const {
        form_id,
        section,
        question_text,
        question_type,
        is_required,
        question_order
    } = req.body;

    if (
        !form_id ||
        !section ||
        !question_text ||
        !question_type ||
        question_order === undefined
    ) {

        return res.status(400).json({
            success: false,
            message: "form_id, section, question_text, question_type and question_order are required"
        });
    }

    // Check form
    db.query(
        "SELECT id FROM feedback_forms WHERE id = ?",
        [form_id],
        (formErr, formResults) => {

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

            const sql = `
                INSERT INTO feedback_questions
                (
                    form_id,
                    section,
                    question_text,
                    question_type,
                    is_required,
                    question_order
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.query(
                sql,
                [
                    form_id,
                    section,
                    question_text,
                    question_type,
                    is_required ?? true,
                    question_order
                ],
                (err, result) => {

                    if (err) {
                        console.error(err);

                        return res.status(500).json({
                            success: false,
                            message: "Failed to create question"
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: "Question created successfully",
                        data: {
                            id: result.insertId,
                            form_id,
                            section,
                            question_text,
                            question_type,
                            is_required: is_required ?? true,
                            question_order
                        }
                    });
                }
            );
        }
    );
};


// =========================
// UPDATE QUESTION
// =========================
const updateQuestion = (req, res) => {

    const id = Number(req.params.id);

    const {
        form_id,
        section,
        question_text,
        question_type,
        is_required,
        question_order
    } = req.body;

    db.query(
        "SELECT id FROM feedback_questions WHERE id = ?",
        [id],
        (checkErr, checkResults) => {

            if (checkErr) {
                console.error(checkErr);

                return res.status(500).json({
                    success: false,
                    message: "Failed to check question"
                });
            }

            if (checkResults.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Question not found"
                });
            }

            const sql = `
                UPDATE feedback_questions
                SET
                    form_id = COALESCE(?, form_id),
                    section = COALESCE(?, section),
                    question_text = COALESCE(?, question_text),
                    question_type = COALESCE(?, question_type),
                    is_required = COALESCE(?, is_required),
                    question_order = COALESCE(?, question_order)
                WHERE id = ?
            `;

            db.query(
                sql,
                [
                    form_id,
                    section,
                    question_text,
                    question_type,
                    is_required,
                    question_order,
                    id
                ],
                (err) => {

                    if (err) {
                        console.error(err);

                        return res.status(500).json({
                            success: false,
                            message: "Failed to update question"
                        });
                    }

                    res.json({
                        success: true,
                        message: "Question updated successfully"
                    });
                }
            );
        }
    );
};


// =========================
// DELETE QUESTION
// =========================
const deleteQuestion = (req, res) => {

    const id = Number(req.params.id);

    db.query(
        "DELETE FROM feedback_questions WHERE id = ?",
        [id],
        (err, result) => {

            if (err) {
                console.error(err);

                if (err.code === "ER_ROW_IS_REFERENCED_2") {

                    return res.status(409).json({
                        success: false,
                        message: "Cannot delete question because related options or responses exist"
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Failed to delete question"
                });
            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Question not found"
                });
            }

            res.json({
                success: true,
                message: "Question deleted successfully"
            });
        }
    );
};


module.exports = {
    getQuestions,
    getQuestionById,
    createQuestion,
    updateQuestion,
    deleteQuestion
};