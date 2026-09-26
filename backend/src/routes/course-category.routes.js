const express = require("express");

const router = express.Router();

const {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require("../controllers/course-category.controller");

const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");


// Get all categories
router.get("/", protect, getCategories);

// Get single category
router.get("/:id", protect, getCategoryById);

// Create category - Admin only
router.post(
    "/",
    protect,
    allowRoles("Admin"),
    createCategory
);

// Update category - Admin only
router.put(
    "/:id",
    protect,
    allowRoles("Admin"),
    updateCategory
);

// Delete category - Admin only
router.delete(
    "/:id",
    protect,
    allowRoles("Admin"),
    deleteCategory
);

module.exports = router;