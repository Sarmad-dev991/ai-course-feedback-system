
const express = require("express");
const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getMyProfile,
    updateMyProfile
} = require("../controllers/user.controller");

const router = express.Router();

// Logged-in user's own profile
router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);

// Admin/user management routes
router.get("/", protect, getUsers);
router.get("/:id", protect, getUserById);

router.post("/", protect, allowRoles("Admin"), createUser);
router.put("/:id", protect, allowRoles("Admin"), updateUser);
router.delete("/:id", protect, allowRoles("Admin"), deleteUser);

module.exports = router;
