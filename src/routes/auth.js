const express = require("express");
const controller = require("../controllers/authController");
const auth = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/register
router.post("/register", controller.register);

// POST /api/auth/login
router.post("/login", controller.login);

// GET  /api/auth/me
router.get("/me", auth, controller.getProfile);

// PATCH /api/auth/me
router.patch("/me", auth, controller.updateProfile);

// PATCH /api/auth/me/password
router.patch("/me/password", auth, controller.changePassword);

module.exports = router;
