const express = require("express");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
    getCourseReport
} = require("../controllers/report.controller");

const router = express.Router();

router.get(
    "/course/:id",
    protect,
    allowRoles("Admin", "Instructor"),
    getCourseReport
);

module.exports = router;