
const db = require("../config/db");
const createAuditLog = require("../utils/auditLogger");

// GET ALL CATEGORIES
const getCategories = (req, res) => {
    const sql = `
        SELECT id, name, description, is_active, created_at
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

        return res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
};


// GET CATEGORY BY ID
const getCategoryById = (req, res) => {
    const id = Number(req.params.id);

    const sql = `
        SELECT id, name, description, is_active, created_at
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

        return res.json({
            success: true,
            data: results[0]
        });
    });
};


// CREATE CATEGORY
const createCategory = (req, res) => {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({
            success: false,
            message: "Category name is required"
        });
    }

    const sql = `
        INSERT INTO course_categories (name, description)
        VALUES (?, ?)
    `;

    db.query(
        sql,
        [name.trim(), description || null],
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
                    message: "Failed to create course category"
                });
            }

            const categoryId = result.insertId;
            const userId = req.user?.userId || req.user?.id || null;
            const role = req.user?.role || "User";

            createAuditLog({
                user_id: userId,
                action: "CATEGORY_CREATED",
                entity_type: "course_category",
                entity_id: categoryId,
                details: `${role} created category: ${name.trim()}`
            });

            return res.status(201).json({
                success: true,
                message: "Course category created successfully",
                data: {
                    id: categoryId,
                    name: name.trim(),
                    description: description || null
                }
            });
        }
    );
};


// UPDATE CATEGORY
const updateCategory = (req, res) => {
    const id = Number(req.params.id);
    const { name, description, is_active } = req.body;

    // Read existing category to detect missing IDs and retain its name.
    db.query(
        "SELECT name FROM course_categories WHERE id = ?",
        [id],
        (findErr, rows) => {
            if (findErr) {
                console.error(findErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to find course category"
                });
            }

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Course category not found"
                });
            }

            const oldName = rows[0].name;

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
                [
                    name === undefined ? null : name.trim(),
                    description === undefined ? null : description,
                    is_active === undefined ? null : is_active,
                    id
                ],
                (err) => {
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

                    const userId = req.user?.userId || req.user?.id || null;
                    const role = req.user?.role || "User";
                    const newName = name ? name.trim() : oldName;

                    createAuditLog({
                        user_id: userId,
                        action: "CATEGORY_UPDATED",
                        entity_type: "course_category",
                        entity_id: id,
                        details: `${role} updated category: ${oldName} → ${newName}`
                    });

                    return res.json({
                        success: true,
                        message: "Course category updated successfully"
                    });
                }
            );
        }
    );
};


// DELETE CATEGORY
const deleteCategory = (req, res) => {
    const id = Number(req.params.id);

    db.query(
        "SELECT name FROM course_categories WHERE id = ?",
        [id],
        (findErr, rows) => {
            if (findErr) {
                console.error(findErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to find course category"
                });
            }

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Course category not found"
                });
            }

            const categoryName = rows[0].name;

            const sql = `
                DELETE FROM course_categories
                WHERE id = ?
            `;

            db.query(sql, [id], (err, result) => {
                if (err) {
                    console.error(err);

                    if (
                        err.code === "ER_ROW_IS_REFERENCED_2" ||
                        err.code === "ER_ROW_IS_REFERENCED"
                    ) {
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

                const userId = req.user?.userId || req.user?.id || null;
                const role = req.user?.role || "User";

                createAuditLog({
                    user_id: userId,
                    action: "CATEGORY_DELETED",
                    entity_type: "course_category",
                    entity_id: id,
                    details: `${role} deleted category: ${categoryName}`
                });

                return res.json({
                    success: true,
                    message: "Course category deleted successfully"
                });
            });
        }
    );
};


module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
