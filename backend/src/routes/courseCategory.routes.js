const express = require("express");

const protect = require("../middleware/auth.middleware");

const allowRoles = require("../middleware/role.middleware");

const {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require("../controllers/courseCategory.controller");


const router = express.Router();


// Get all categories
router.get(
    "/",
    protect,
    getCategories
);


// Get category by ID
router.get(
    "/:id",
    protect,
    getCategoryById
);


// Create category
router.post(
    "/",
    protect,
    allowRoles("Admin"),
    createCategory
);


// Update category
router.put(
    "/:id",
    protect,
    allowRoles("Admin"),
    updateCategory
);


// Delete category
router.delete(
    "/:id",
    protect,
    allowRoles("Admin"),
    deleteCategory
);


module.exports = router;