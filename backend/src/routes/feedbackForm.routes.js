const express = require("express");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
    getFeedbackForms,
    getFeedbackFormById,
    createFeedbackForm,
    updateFeedbackForm,
    deleteFeedbackForm
} = require("../controllers/feedbackForm.controller");

const router = express.Router();

router.get("/", protect, getFeedbackForms);
router.get("/:id", protect, getFeedbackFormById);

router.post("/", protect, allowRoles("Admin"), createFeedbackForm);
router.put("/:id", protect, allowRoles("Admin"), updateFeedbackForm);
router.delete("/:id", protect, allowRoles("Admin"), deleteFeedbackForm);

module.exports = router;