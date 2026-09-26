const express = require("express");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
    getTextResponses,
    getTextResponseById,
    createTextResponse,
    updateTextResponse,
    deleteTextResponse
} = require("../controllers/textResponse.controller");

const router = express.Router();

router.get("/", protect, getTextResponses);
router.get("/:id", protect, getTextResponseById);

router.post(
    "/",
    protect,
    allowRoles("Student", "Admin"),
    createTextResponse
);

router.put(
    "/:id",
    protect,
    allowRoles("Admin"),
    updateTextResponse
);

router.delete(
    "/:id",
    protect,
    allowRoles("Admin"),
    deleteTextResponse
);

module.exports = router;