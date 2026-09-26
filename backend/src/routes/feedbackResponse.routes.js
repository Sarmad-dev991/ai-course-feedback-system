const express = require("express");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const validateFeedbackResponse = require("../validators/feedbackResponse.validator");
const {submitFeedback, getMyFeedback, getCourseFeedback} = require("../controllers/feedbackResponse.controller");

const router = express.Router();

router.post(
    "/",
    protect,
    validateFeedbackResponse,
    submitFeedback
);

router.get(
    "/my",
    protect,
    getMyFeedback
);

router.get(
    "/course/:courseId",
    protect,
    allowRoles("Admin", "Instructor"),
    getCourseFeedback
);

module.exports = router;