const express = require("express");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
    getRatingResponses,
    getRatingResponseById,
    createRatingResponse,
    updateRatingResponse,
    deleteRatingResponse
} = require("../controllers/ratingResponse.controller");

const router = express.Router();

router.get("/", protect, getRatingResponses);
router.get("/:id", protect, getRatingResponseById);

router.post(
    "/",
    protect,
    allowRoles("Student", "Admin"),
    createRatingResponse
);

router.put(
    "/:id",
    protect,
    allowRoles("Admin"),
    updateRatingResponse
);

router.delete(
    "/:id",
    protect,
    allowRoles("Admin"),
    deleteRatingResponse
);

module.exports = router;