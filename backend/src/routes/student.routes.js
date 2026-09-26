const express = require("express");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
} = require("../controllers/student.controller");

const router = express.Router();

router.get("/", protect, getStudents);
router.get("/:id", protect, getStudentById);

router.post("/", protect, allowRoles("Admin"), createStudent);
router.put("/:id", protect, allowRoles("Admin"), updateStudent);
router.delete("/:id", protect, allowRoles("Admin"), deleteStudent);

module.exports = router;