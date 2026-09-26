const db = require("../config/db");

// GET ALL AUDIT LOGS
const getAuditLogs = (req, res) => {
    const sql = `
        SELECT
            al.id,
            al.user_id,
            u.name AS user_name,
            al.action,
            al.entity_type,
            al.entity_id,
            al.details,
            al.created_at
        FROM audit_logs al
        LEFT JOIN users u
            ON al.user_id = u.id
        ORDER BY al.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch audit logs"
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
};


// GET AUDIT LOG BY ID
const getAuditLogById = (req, res) => {
    const id = Number(req.params.id);

    const sql = `
        SELECT
            al.id,
            al.user_id,
            u.name AS user_name,
            al.action,
            al.entity_type,
            al.entity_id,
            al.details,
            al.created_at
        FROM audit_logs al
        LEFT JOIN users u
            ON al.user_id = u.id
        WHERE al.id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch audit log"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Audit log not found"
            });
        }

        res.json({
            success: true,
            data: results[0]
        });
    });
};


// CREATE AUDIT LOG
const createAuditLog = (req, res) => {
    const {
        user_id,
        action,
        entity_type,
        entity_id,
        details
    } = req.body;

    if (!action) {
        return res.status(400).json({
            success: false,
            message: "action is required"
        });
    }

    const insertLog = () => {
        const sql = `
            INSERT INTO audit_logs
            (
                user_id,
                action,
                entity_type,
                entity_id,
                details
            )
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                user_id || null,
                action,
                entity_type || null,
                entity_id || null,
                details || null
            ],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        success: false,
                        message: "Failed to create audit log"
                    });
                }

                res.status(201).json({
                    success: true,
                    message: "Audit log created successfully",
                    data: {
                        id: result.insertId,
                        user_id: user_id || null,
                        action,
                        entity_type: entity_type || null,
                        entity_id: entity_id || null,
                        details: details || null
                    }
                });
            }
        );
    };

    // user_id is optional
    if (!user_id) {
        insertLog();
        return;
    }

    db.query(
        "SELECT id FROM users WHERE id = ?",
        [user_id],
        (userErr, userResults) => {
            if (userErr) {
                console.error(userErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to check user"
                });
            }

            if (userResults.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "User not found"
                });
            }

            insertLog();
        }
    );
};


// UPDATE AUDIT LOG
const updateAuditLog = (req, res) => {
    const id = Number(req.params.id);

    const {
        user_id,
        action,
        entity_type,
        entity_id,
        details
    } = req.body;

    db.query(
        "SELECT id FROM audit_logs WHERE id = ?",
        [id],
        (checkErr, checkResults) => {
            if (checkErr) {
                console.error(checkErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to check audit log"
                });
            }

            if (checkResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Audit log not found"
                });
            }

            const sql = `
                UPDATE audit_logs
                SET
                    user_id = COALESCE(?, user_id),
                    action = COALESCE(?, action),
                    entity_type = COALESCE(?, entity_type),
                    entity_id = COALESCE(?, entity_id),
                    details = COALESCE(?, details)
                WHERE id = ?
            `;

            db.query(
                sql,
                [
                    user_id,
                    action,
                    entity_type,
                    entity_id,
                    details,
                    id
                ],
                (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            success: false,
                            message: "Failed to update audit log"
                        });
                    }

                    res.json({
                        success: true,
                        message: "Audit log updated successfully"
                    });
                }
            );
        }
    );
};


// DELETE AUDIT LOG
const deleteAuditLog = (req, res) => {
    const id = Number(req.params.id);

    db.query(
        "DELETE FROM audit_logs WHERE id = ?",
        [id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to delete audit log"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Audit log not found"
                });
            }

            res.json({
                success: true,
                message: "Audit log deleted successfully"
            });
        }
    );
};


module.exports = {
    getAuditLogs,
    getAuditLogById,
    createAuditLog,
    updateAuditLog,
    deleteAuditLog
};