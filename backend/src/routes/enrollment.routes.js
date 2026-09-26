const express = require("express");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
    getEnrollments,
    getEnrollmentById,
    createEnrollment,
    updateEnrollment,
    deleteEnrollment
} = require("../controllers/enrollment.controller");

const router = express.Router();


// Logged-in users can view enrollments

router.get(
    "/",
    protect,
    getEnrollments
);


// Logged-in users can view one enrollment

router.get(
    "/:id",
    protect,
    getEnrollmentById
);


// Admin can create enrollment

router.post(
    "/",
    protect,
    allowRoles("Admin"),
    createEnrollment
);


// Admin can update enrollment

router.put(
    "/:id",
    protect,
    allowRoles("Admin"),
    updateEnrollment
);


// Admin can delete enrollment

router.delete(
    "/:id",
    protect,
    allowRoles("Admin"),
    deleteEnrollment
);


module.exports = router;