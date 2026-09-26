// Course ka actual business logic yahan h: courses dekhna, single course dekhna, course create/ update/ delete karna

// Course business logic
const db = require("../config/db");

const getCourses = (req, res) => {
    const sql = `
        SELECT 
            c.id,
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

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
};


const getCourseById = (req, res) => {
    const id = Number(req.params.id);

    const sql = `
        SELECT 
            c.id,
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

        res.json({
            success: true,
            data: results[0]
        });
    });
};


const createCourse = (req, res) => {
    const { title, category_id, description } = req.body;

    const sql = `
        INSERT INTO courses (category_id, title, description)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [category_id, title, description],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to create course"
                });
            }

            res.status(201).json({
                success: true,
                message: "Course created successfully",
                data: {
                    id: result.insertId,
                    title,
                    category_id,
                    description
                }
            });
        }
    );
};


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
        [title, category_id, description, is_active, id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to update course"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Course not found"
                });
            }

            res.json({
                success: true,
                message: "Course updated successfully"
            });
        }
    );
};


const deleteCourse = (req, res) => {
    const id = Number(req.params.id);

    const sql = `DELETE FROM courses WHERE id = ?`;

    db.query(sql, [id], (err, result) => {
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

        res.json({
            success: true,
            message: "Course deleted successfully"
        });
    });
};


const findCourse = (courseId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM courses WHERE id = ?`;

        db.query(sql, [courseId], (err, results) => {
            if (err) {
                reject(err);
                return;
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