
const db = require("../config/db");

const createAuditLog = ({
    user_id = null,
    action,
    entity_type = null,
    entity_id = null,
    details = null
}) => {
    if (!action) {
        console.error("Audit log skipped: action is required");
        return;
    }

    const sql = `
        INSERT INTO audit_logs
        (user_id, action, entity_type, entity_id, details)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            user_id || null,
            action,
            entity_type,
            entity_id,
            details
        ],
        (err) => {
            if (err) {
                console.error("Audit log insert failed:", err.message);
            }
        }
    );
};

module.exports = createAuditLog;
