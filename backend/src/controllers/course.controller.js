
const db = require("../config/db");
const createAuditLog = require("../utils/auditLogger");

// GET ALL COURSES
const getCourses = (req, res) => {
    const sql = `
        SELECT
            c.id,
            c.category_id,
            c.title,
            c.description,
            c.is_active,
            c.created_at,
            cc.name AS category
        FROM courses c
        JOIN course_categories cc ON c.category_id = cc.id
        ORDER BY c.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch courses"
            });
        }

        return res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
};


// GET COURSE BY ID
const getCourseById = (req, res) => {
    const id = Number(req.params.id);

    const sql = `
        SELECT
            c.id,
            c.category_id,
            c.title,
            c.description,
            c.is_active,
            c.created_at,
            cc.name AS category
        FROM courses c
        JOIN course_categories cc ON c.category_id = cc.id
        WHERE c.id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch course"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        return res.json({
            success: true,
            data: results[0]
        });
    });
};


// CREATE COURSE
const createCourse = (req, res) => {
    const { title, category_id, description } = req.body;

    if (!title || !category_id) {
        return res.status(400).json({
            success: false,
            message: "Course title and category are required"
        });
    }

    const sql = `
        INSERT INTO courses (category_id, title, description)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [category_id, title, description || null],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to create course"
                });
            }

            const courseId = result.insertId;
            const userId = req.user?.userId || req.user?.id || null;
            const role = req.user?.role || "User";

            createAuditLog({
                user_id: userId,
                action: "COURSE_CREATED",
                entity_type: "course",
                entity_id: courseId,
                details: `${role} created course: ${title}`
            });

            return res.status(201).json({
                success: true,
                message: "Course created successfully",
                data: {
                    id: courseId,
                    title,
                    category_id,
                    description: description || null
                }
            });
        }
    );
};


// UPDATE COURSE
const updateCourse = (req, res) => {
    const id = Number(req.params.id);
    const { title, category_id, description, is_active } = req.body;

    const sql = `
        UPDATE courses
        SET
            title = COALESCE(?, title),
            category_id = COALESCE(?, category_id),
            description = COALESCE(?, description),
            is_active = COALESCE(?, is_active)
        WHERE id = ?
    `;

    db.query(
        sql,
        [title ?? null, category_id ?? null, description ?? null, is_active ?? null, id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to update course"
                });
            }

            if (result.affectedRows === 0) {
                // Check whether the course exists, since an unchanged
                // record can also produce zero affected rows in MySQL.
                return db.query(
                    "SELECT id FROM courses WHERE id = ?",
                    [id],
                    (checkErr, rows) => {
                        if (checkErr) {
                            console.error(checkErr);
                            return res.status(500).json({
                                success: false,
                                message: "Failed to verify course"
                            });
                        }

                        if (rows.length === 0) {
                            return res.status(404).json({
                                success: false,
                                message: "Course not found"
                            });
                        }

                        const userId = req.user?.userId || req.user?.id || null;
                        const role = req.user?.role || "User";

                        createAuditLog({
                            user_id: userId,
                            action: "COURSE_UPDATED",
                            entity_type: "course",
                            entity_id: id,
                            details: `${role} updated course ID ${id}`
                        });

                        return res.json({
                            success: true,
                            message: "Course updated successfully"
                        });
                    }
                );
            }

            const userId = req.user?.userId || req.user?.id || null;
            const role = req.user?.role || "User";

            createAuditLog({
                user_id: userId,
                action: "COURSE_UPDATED",
                entity_type: "course",
                entity_id: id,
                details: `${role} updated course ID ${id}`
            });

            return res.json({
                success: true,
                message: "Course updated successfully"
            });
        }
    );
};


// DELETE COURSE
const deleteCourse = (req, res) => {
    const id = Number(req.params.id);

    // Read title first so the log remains meaningful after deletion.
    db.query(
        "SELECT title FROM courses WHERE id = ?",
        [id],
        (selectErr, rows) => {
            if (selectErr) {
                console.error(selectErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to find course"
                });
            }

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Course not found"
                });
            }

            const courseTitle = rows[0].title;

            db.query(
                "DELETE FROM courses WHERE id = ?",
                [id],
                (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            success: false,
                            message: "Failed to delete course"
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            success: false,
                            message: "Course not found"
                        });
                    }

                    const userId = req.user?.userId || req.user?.id || null;
                    const role = req.user?.role || "User";

                    createAuditLog({
                        user_id: userId,
                        action: "COURSE_DELETED",
                        entity_type: "course",
                        entity_id: id,
                        details: `${role} deleted course: ${courseTitle}`
                    });

                    return res.json({
                        success: true,
                        message: "Course deleted successfully"
                    });
                }
            );
        }
    );
};


// FIND COURSE (used by other backend modules)
const findCourse = (courseId) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM courses WHERE id = ?";

        db.query(sql, [courseId], (err, results) => {
            if (err) {
                return reject(err);
            }

            resolve(results[0] || null);
        });
    });
};


module.exports = {
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    findCourse
};
