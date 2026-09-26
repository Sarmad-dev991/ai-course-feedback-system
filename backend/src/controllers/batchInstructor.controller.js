const db = require("../config/db");

// GET all assignments
const getBatchInstructors = (req, res) => {
    const sql = `
        SELECT
            bi.id,
            bi.batch_id,
            b.name AS batch,
            bi.instructor_id,
            u.name AS instructor,
            i.instructor_id AS instructor_code,
            bi.assigned_at
        FROM batch_instructors bi
        JOIN batches b ON bi.batch_id = b.id
        JOIN instructors i ON bi.instructor_id = i.id
        JOIN users u ON i.user_id = u.id
        ORDER BY bi.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch batch instructors"
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
};


// GET assignment by ID
const getBatchInstructorById = (req, res) => {
    const id = Number(req.params.id);

    const sql = `
        SELECT
            bi.id,
            bi.batch_id,
            b.name AS batch,
            bi.instructor_id,
            u.name AS instructor,
            i.instructor_id AS instructor_code,
            bi.assigned_at
        FROM batch_instructors bi
        JOIN batches b ON bi.batch_id = b.id
        JOIN instructors i ON bi.instructor_id = i.id
        JOIN users u ON i.user_id = u.id
        WHERE bi.id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch assignment"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        res.json({
            success: true,
            data: results[0]
        });
    });
};


// CREATE assignment
const createBatchInstructor = (req, res) => {
    const { batch_id, instructor_id } = req.body;

    if (!batch_id || !instructor_id) {
        return res.status(400).json({
            success: false,
            message: "batch_id and instructor_id are required"
        });
    }

    // Check batch
    db.query(
        "SELECT id FROM batches WHERE id = ?",
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

            // Check instructor
            db.query(
                "SELECT id FROM instructors WHERE id = ?",
                [instructor_id],
                (instructorErr, instructorResults) => {

                    if (instructorErr) {
                        console.error(instructorErr);
                        return res.status(500).json({
                            success: false,
                            message: "Failed to check instructor"
                        });
                    }

                    if (instructorResults.length === 0) {
                        return res.status(400).json({
                            success: false,
                            message: "Instructor not found"
                        });
                    }

                    // Check duplicate assignment
                    db.query(
                        `
                        SELECT id
                        FROM batch_instructors
                        WHERE batch_id = ?
                        AND instructor_id = ?
                        `,
                        [batch_id, instructor_id],
                        (duplicateErr, duplicateResults) => {

                            if (duplicateErr) {
                                console.error(duplicateErr);
                                return res.status(500).json({
                                    success: false,
                                    message: "Failed to check assignment"
                                });
                            }

                            if (duplicateResults.length > 0) {
                                return res.status(409).json({
                                    success: false,
                                    message: "Instructor is already assigned to this batch"
                                });
                            }

                            const sql = `
                                INSERT INTO batch_instructors
                                (batch_id, instructor_id)
                                VALUES (?, ?)
                            `;

                            db.query(
                                sql,
                                [batch_id, instructor_id],
                                (err, result) => {

                                    if (err) {
                                        console.error(err);
                                        return res.status(500).json({
                                            success: false,
                                            message: "Failed to assign instructor"
                                        });
                                    }

                                    res.status(201).json({
                                        success: true,
                                        message: "Instructor assigned successfully",
                                        data: {
                                            id: result.insertId,
                                            batch_id,
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
};


// UPDATE assignment
const updateBatchInstructor = (req, res) => {
    const id = Number(req.params.id);
    const { batch_id, instructor_id } = req.body;

    db.query(
        "SELECT id FROM batch_instructors WHERE id = ?",
        [id],
        (checkErr, checkResults) => {

            if (checkErr) {
                console.error(checkErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to check assignment"
                });
            }

            if (checkResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Assignment not found"
                });
            }

            const sql = `
                UPDATE batch_instructors
                SET
                    batch_id = COALESCE(?, batch_id),
                    instructor_id = COALESCE(?, instructor_id)
                WHERE id = ?
            `;

            db.query(
                sql,
                [batch_id, instructor_id, id],
                (err, result) => {

                    if (err) {
                        console.error(err);

                        if (err.code === "ER_DUP_ENTRY") {
                            return res.status(409).json({
                                success: false,
                                message: "This assignment already exists"
                            });
                        }

                        return res.status(500).json({
                            success: false,
                            message: "Failed to update assignment"
                        });
                    }

                    res.json({
                        success: true,
                        message: "Assignment updated successfully"
                    });
                }
            );
        }
    );
};


// DELETE assignment
const deleteBatchInstructor = (req, res) => {
    const id = Number(req.params.id);

    db.query(
        "DELETE FROM batch_instructors WHERE id = ?",
        [id],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to delete assignment"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Assignment not found"
                });
            }

            res.json({
                success: true,
                message: "Instructor assignment deleted successfully"
            });
        }
    );
};


module.exports = {
    getBatchInstructors,
    getBatchInstructorById,
    createBatchInstructor,
    updateBatchInstructor,
    deleteBatchInstructor
};