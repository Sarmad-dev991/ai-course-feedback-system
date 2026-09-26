const db = require("../config/db");


// GET all enrollments

const getEnrollments = (req, res) => {

    const sql = `
        SELECT
            e.id,
            e.student_id,
            s.student_id AS student_number,
            u.name AS student_name,
            e.batch_id,
            b.name AS batch_name,
            c.title AS course,
            e.enrolled_at
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN users u ON s.user_id = u.id
        JOIN batches b ON e.batch_id = b.id
        JOIN courses c ON b.course_id = c.id
        ORDER BY e.id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch enrollments"
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });

    });
};


// GET enrollment by ID

const getEnrollmentById = (req, res) => {

    const id = Number(req.params.id);

    const sql = `
        SELECT
            e.id,
            e.student_id,
            s.student_id AS student_number,
            u.name AS student_name,
            e.batch_id,
            b.name AS batch_name,
            c.title AS course,
            e.enrolled_at
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN users u ON s.user_id = u.id
        JOIN batches b ON e.batch_id = b.id
        JOIN courses c ON b.course_id = c.id
        WHERE e.id = ?
    `;

    db.query(sql, [id], (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch enrollment"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Enrollment not found"
            });
        }

        res.json({
            success: true,
            data: results[0]
        });

    });
};


// POST create enrollment

const createEnrollment = (req, res) => {

    const { student_id, batch_id } = req.body;

    if (!student_id || !batch_id) {
        return res.status(400).json({
            success: false,
            message: "student_id and batch_id are required"
        });
    }

    // Check student

    const studentSql = `
        SELECT id
        FROM students
        WHERE id = ?
    `;

    db.query(studentSql, [student_id], (studentErr, studentResults) => {

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


        // Check batch

        const batchSql = `
            SELECT id
            FROM batches
            WHERE id = ?
        `;

        db.query(batchSql, [batch_id], (batchErr, batchResults) => {

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


            // Check duplicate enrollment

            const duplicateSql = `
                SELECT id
                FROM enrollments
                WHERE student_id = ?
                AND batch_id = ?
            `;

            db.query(
                duplicateSql,
                [student_id, batch_id],
                (duplicateErr, duplicateResults) => {

                    if (duplicateErr) {
                        console.error(duplicateErr);

                        return res.status(500).json({
                            success: false,
                            message: "Failed to check existing enrollment"
                        });
                    }

                    if (duplicateResults.length > 0) {
                        return res.status(409).json({
                            success: false,
                            message: "Student is already enrolled in this batch"
                        });
                    }


                    // Create enrollment

                    const sql = `
                        INSERT INTO enrollments
                        (student_id, batch_id)
                        VALUES (?, ?)
                    `;

                    db.query(
                        sql,
                        [student_id, batch_id],
                        (err, result) => {

                            if (err) {
                                console.error(err);

                                return res.status(500).json({
                                    success: false,
                                    message: "Failed to create enrollment"
                                });
                            }

                            res.status(201).json({
                                success: true,
                                message: "Enrollment created successfully",
                                data: {
                                    id: result.insertId,
                                    student_id,
                                    batch_id
                                }
                            });

                        }
                    );

                }
            );

        });

    });

};


// PUT update enrollment

const updateEnrollment = (req, res) => {

    const id = Number(req.params.id);

    const { student_id, batch_id } = req.body;

    if (!student_id || !batch_id) {
        return res.status(400).json({
            success: false,
            message: "student_id and batch_id are required"
        });
    }


    const checkSql = `
        SELECT id
        FROM enrollments
        WHERE id = ?
    `;

    db.query(checkSql, [id], (checkErr, checkResults) => {

        if (checkErr) {
            console.error(checkErr);

            return res.status(500).json({
                success: false,
                message: "Failed to check enrollment"
            });
        }

        if (checkResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Enrollment not found"
            });
        }


        const duplicateSql = `
            SELECT id
            FROM enrollments
            WHERE student_id = ?
            AND batch_id = ?
            AND id != ?
        `;

        db.query(
            duplicateSql,
            [student_id, batch_id, id],
            (duplicateErr, duplicateResults) => {

                if (duplicateErr) {
                    console.error(duplicateErr);

                    return res.status(500).json({
                        success: false,
                        message: "Failed to check duplicate enrollment"
                    });
                }

                if (duplicateResults.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: "Student is already enrolled in this batch"
                    });
                }


                const sql = `
                    UPDATE enrollments
                    SET
                        student_id = ?,
                        batch_id = ?
                    WHERE id = ?
                `;

                db.query(
                    sql,
                    [student_id, batch_id, id],
                    (err) => {

                        if (err) {
                            console.error(err);

                            return res.status(500).json({
                                success: false,
                                message: "Failed to update enrollment"
                            });
                        }

                        res.json({
                            success: true,
                            message: "Enrollment updated successfully"
                        });

                    }
                );

            }
        );

    });

};


// DELETE enrollment

const deleteEnrollment = (req, res) => {

    const id = Number(req.params.id);

    const sql = `
        DELETE FROM enrollments
        WHERE id = ?
    `;

    db.query(sql, [id], (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to delete enrollment"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Enrollment not found"
            });
        }

        res.json({
            success: true,
            message: "Enrollment deleted successfully"
        });

    });

};


module.exports = {
    getEnrollments,
    getEnrollmentById,
    createEnrollment,
    updateEnrollment,
    deleteEnrollment
};