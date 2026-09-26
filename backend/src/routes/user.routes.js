const express = require("express");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} = require("../controllers/user.controller");

const router = express.Router();


// Logged-in users can view users

router.get(
    "/",
    protect,
    getUsers
);


// Logged-in users can view one user

router.get(
    "/:id",
    protect,
    getUserById
);


// Admin can create user

router.post(
    "/",
    protect,
    allowRoles("Admin"),
    createUser
);


// Admin can update user

router.put(
    "/:id",
    protect,
    allowRoles("Admin"),
    updateUser
);


// Admin can delete user

router.delete(
    "/:id",
    protect,
    allowRoles("Admin"),
    deleteUser
);


module.exports = router;