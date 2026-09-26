const express = require("express");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
    getAIAnalyses,
    getAIAnalysisById,
    createAIAnalysis,
    updateAIAnalysis,
    deleteAIAnalysis
} = require("../controllers/aiAnalysis.controller");

const router = express.Router();

router.get("/", protect, getAIAnalyses);
router.get("/:id", protect, getAIAnalysisById);

router.post(
    "/",
    protect,
    allowRoles("Admin"),
    createAIAnalysis
);

router.put(
    "/:id",
    protect,
    allowRoles("Admin"),
    updateAIAnalysis
);

router.delete(
    "/:id",
    protect,
    allowRoles("Admin"),
    deleteAIAnalysis
);

module.exports = router;