// Batch ka business logic

const db = require("../config/db");


// Get all batches
const getBatches = (req, res) => {
    const sql = `
        SELECT
            b.id,
            b.course_id,
            c.title AS course,
            b.name,
            b.start_date,
            b.end_date,
            b.is_active,
            b.created_at
        FROM batches b
        JOIN courses c ON b.course_id = c.id
        ORDER BY b.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch batches"
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
};


// Get single batch
const getBatchById = (req, res) => {
    const id = Number(req.params.id);

    const sql = `
        SELECT
            b.id,
            b.course_id,
            c.title AS course,
            b.name,
            b.start_date,
            b.end_date,
            b.is_active,
            b.created_at
        FROM batches b
        JOIN courses c ON b.course_id = c.id
        WHERE b.id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch batch"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Batch not found"
            });
        }

        res.json({
            success: true,
            data: results[0]
        });
    });
};


// Create batch
const createBatch = (req, res) => {
    const {
        course_id,
        name,
        start_date,
        end_date
    } = req.body;

    const sql = `
        INSERT INTO batches
        (course_id, name, start_date, end_date)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [course_id, name, start_date, end_date],
        (err, result) => {
            if (err) {
                console.error(err);

                if (err.code === "ER_NO_REFERENCED_ROW_2") {
                    return res.status(400).json({
                        success: false,
                        message: "Course not found"
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Failed to create batch"
                });
            }

            res.status(201).json({
                success: true,
                message: "Batch created successfully",
                data: {
                    id: result.insertId,
                    course_id,
                    name,
                    start_date,
                    end_date
                }
            });
        }
    );
};


// Update batch
const updateBatch = (req, res) => {
    const id = Number(req.params.id);

    const {
        course_id,
        name,
        start_date,
        end_date,
        is_active
    } = req.body;

    const sql = `
        UPDATE batches
        SET
            course_id = COALESCE(?, course_id),
            name = COALESCE(?, name),
            start_date = COALESCE(?, start_date),
            end_date = COALESCE(?, end_date),
            is_active = COALESCE(?, is_active)
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            course_id,
            name,
            start_date,
            end_date,
            is_active,
            id
        ],
        (err, result) => {
            if (err) {
                console.error(err);

                if (err.code === "ER_NO_REFERENCED_ROW_2") {
                    return res.status(400).json({
                        success: false,
                        message: "Course not found"
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Failed to update batch"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Batch not found"
                });
            }

            res.json({
                success: true,
                message: "Batch updated successfully"
            });
        }
    );
};


// Delete batch
const deleteBatch = (req, res) => {
    const id = Number(req.params.id);

    const sql = `
        DELETE FROM batches
        WHERE id = ?
    `;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to delete batch"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Batch not found"
            });
        }

        res.json({
            success: true,
            message: "Batch deleted successfully"
        });
    });
};


module.exports = {
    getBatches,
    getBatchById,
    createBatch,
    updateBatch,
    deleteBatch
};