const express = require("express");

const protect =
    require("../middleware/auth.middleware");

const allowRoles =
    require("../middleware/role.middleware");

const {
    getCourseAnalytics,
    getAdminSummary
} = require("../controllers/analytics.controller");


const router = express.Router();


// Course analytics
router.get(
    "/course/:id",
    protect,
    allowRoles("Instructor", "Admin"),
    getCourseAnalytics
);


// Admin summary
router.get(
    "/admin-summary",
    protect,
    allowRoles("Admin"),
    getAdminSummary
);


module.exports = router;