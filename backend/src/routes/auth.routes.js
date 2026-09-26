const express = require("express");

const {
    login,
    logout
} = require("../controllers/auth.controller");

const validateLogin = require("../validators/login.validator");
const protect = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/login", validateLogin, login);

router.post("/logout", protect, logout);

module.exports = router;