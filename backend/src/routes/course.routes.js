// Ye decide krta h k kis URL par knsa controller chalega.

const validateCourse = require("../validators/course.validator");
const express = require("express");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse
} = require("../controllers/course.controller");

const router = express.Router();

// Logged-in users can view courses
router.get("/", protect, getCourses);

// Logged-in users can view one course
router.get("/:id", protect, getCourseById);

// Admin can create/validate a course
router.post("/", protect, allowRoles("Admin"), validateCourse, createCourse);


// Admin can update/validate a course
router.put("/:id", protect, allowRoles("Admin"), validateCourse, updateCourse);

// Admin can delete a course
router.delete("/:id", protect, allowRoles("Admin"), deleteCourse);

module.exports = router;