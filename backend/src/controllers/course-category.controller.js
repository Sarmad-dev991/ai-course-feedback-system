// Course Category ka business logic

const db = require("../config/db");


// Get all categories
const getCategories = (req, res) => {
    const sql = `
        SELECT
            id,
            name,
            description,
            is_active,
            created_at
        FROM course_categories
        ORDER BY id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch course categories"
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
};


// Get single category
const getCategoryById = (req, res) => {
    const id = Number(req.params.id);

    const sql = `
        SELECT
            id,
            name,
            description,
            is_active,
            created_at
        FROM course_categories
        WHERE id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch course category"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course category not found"
            });
        }

        res.json({
            success: true,
            data: results[0]
        });
    });
};


// Create category
const createCategory = (req, res) => {
    const { name, description } = req.body;

    const sql = `
        INSERT INTO course_categories (name, description)
        VALUES (?, ?)
    `;

    db.query(sql, [name, description], (err, result) => {
        if (err) {
            console.error(err);

            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    success: false,
                    message: "Course category already exists"
                });
            }

            return res.status(500).json({
                success: false,
                message: "Failed to create course category"
            });
        }

        res.status(201).json({
            success: true,
            message: "Course category created successfully",
            data: {
                id: result.insertId,
                name,
                description
            }
        });
    });
};


// Update category
const updateCategory = (req, res) => {
    const id = Number(req.params.id);
    const { name, description, is_active } = req.body;

    const sql = `
        UPDATE course_categories
        SET
            name = COALESCE(?, name),
            description = COALESCE(?, description),
            is_active = COALESCE(?, is_active)
        WHERE id = ?
    `;

    db.query(
        sql,
        [name, description, is_active, id],
        (err, result) => {
            if (err) {
                console.error(err);

                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        success: false,
                        message: "Course category already exists"
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Failed to update course category"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Course category not found"
                });
            }

            res.json({
                success: true,
                message: "Course category updated successfully"
            });
        }
    );
};


// Delete category
const deleteCategory = (req, res) => {
    const id = Number(req.params.id);

    const sql = `
        DELETE FROM course_categories
        WHERE id = ?
    `;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);

            if (err.code === "ER_ROW_IS_REFERENCED_2") {
                return res.status(409).json({
                    success: false,
                    message: "Cannot delete category because it is being used by a course"
                });
            }

            return res.status(500).json({
                success: false,
                message: "Failed to delete course category"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Course category not found"
            });
        }

        res.json({
            success: true,
            message: "Course category deleted successfully"
        });
    });
};


module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};