const express = require("express");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
    getQuestions,
    getQuestionById,
    createQuestion,
    updateQuestion,
    deleteQuestion
} = require("../controllers/question.controller");

const router = express.Router();

router.get("/", protect, getQuestions);
router.get("/:id", protect, getQuestionById);

router.post("/", protect, allowRoles("Admin"), createQuestion);
router.put("/:id", protect, allowRoles("Admin"), updateQuestion);
router.delete("/:id", protect, allowRoles("Admin"), deleteQuestion);

module.exports = router;