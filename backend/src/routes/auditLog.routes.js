const express = require("express");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
    getAuditLogs,
    getAuditLogById,
    createAuditLog,
    updateAuditLog,
    deleteAuditLog
} = require("../controllers/auditLog.controller");

const router = express.Router();

router.get("/", protect, allowRoles("Admin"), getAuditLogs);
router.get("/:id", protect, allowRoles("Admin"), getAuditLogById);

router.post(
    "/",
    protect,
    allowRoles("Admin"),
    createAuditLog
);

router.put(
    "/:id",
    protect,
    allowRoles("Admin"),
    updateAuditLog
);

router.delete(
    "/:id",
    protect,
    allowRoles("Admin"),
    deleteAuditLog
);

module.exports = router;