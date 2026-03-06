const express = require("express");
const controller = require("../controllers/authController");

const router = express.Router();

// POST /api/auth/register
router.post("/register", controller.register);

// POST /api/auth/login
router.post("/login", controller.login);

module.exports = router;
