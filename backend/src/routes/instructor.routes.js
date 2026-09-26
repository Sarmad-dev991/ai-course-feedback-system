const express = require("express");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
    getInstructors,
    getInstructorById,
    createInstructor,
    updateInstructor,
    deleteInstructor
} = require("../controllers/instructor.controller");

const router = express.Router();

router.get("/", protect, getInstructors);
router.get("/:id", protect, getInstructorById);

router.post("/", protect, allowRoles("Admin"), createInstructor);
router.put("/:id", protect, allowRoles("Admin"), updateInstructor);
router.delete("/:id", protect, allowRoles("Admin"), deleteInstructor);

module.exports = router;