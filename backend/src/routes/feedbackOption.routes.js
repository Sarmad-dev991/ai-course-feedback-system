const express = require("express");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
    getFeedbackOptions,
    getFeedbackOptionById,
    createFeedbackOption,
    updateFeedbackOption,
    deleteFeedbackOption
} = require("../controllers/feedbackOption.controller");

const router = express.Router();

router.get("/", protect, getFeedbackOptions);
router.get("/:id", protect, getFeedbackOptionById);

router.post("/", protect, allowRoles("Admin"), createFeedbackOption);
router.put("/:id", protect, allowRoles("Admin"), updateFeedbackOption);
router.delete("/:id", protect, allowRoles("Admin"), deleteFeedbackOption);

module.exports = router;