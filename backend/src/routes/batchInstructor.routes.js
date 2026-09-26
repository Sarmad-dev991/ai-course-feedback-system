const express = require("express");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
    getBatchInstructors,
    getBatchInstructorById,
    createBatchInstructor,
    updateBatchInstructor,
    deleteBatchInstructor
} = require("../controllers/batchInstructor.controller");

const router = express.Router();

router.get("/", protect, getBatchInstructors);
router.get("/:id", protect, getBatchInstructorById);

router.post("/", protect, allowRoles("Admin"), createBatchInstructor);
router.put("/:id", protect, allowRoles("Admin"), updateBatchInstructor);
router.delete("/:id", protect, allowRoles("Admin"), deleteBatchInstructor);

module.exports = router;