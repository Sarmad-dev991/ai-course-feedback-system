const express = require("express");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
    getFeedbackSubmissions,
    getFeedbackSubmissionById,
    createFeedbackSubmission,
    updateFeedbackSubmission,
    deleteFeedbackSubmission
} = require("../controllers/feedbackSubmission.controller");

const router = express.Router();

router.get("/", protect, getFeedbackSubmissions);
router.get("/:id", protect, getFeedbackSubmissionById);

router.post(
    "/",
    protect,
    allowRoles("Student", "Admin"),
    createFeedbackSubmission
);

router.put(
    "/:id",
    protect,
    allowRoles("Admin"),
    updateFeedbackSubmission
);

router.delete(
    "/:id",
    protect,
    allowRoles("Admin"),
    deleteFeedbackSubmission
);

module.exports = router;