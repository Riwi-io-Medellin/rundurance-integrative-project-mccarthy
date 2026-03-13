const express = require("express");
const rateLimit = require("express-rate-limit");
const controller = require("../controllers/authController");
const auth = require("../middleware/auth");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Intenta de nuevo en 15 minutos." },
});

// POST /api/auth/register
router.post("/register", authLimiter, controller.register);

// POST /api/auth/login
router.post("/login", authLimiter, controller.login);

// GET  /api/auth/me
router.get("/me", auth, controller.getProfile);

// PATCH /api/auth/me
router.patch("/me", auth, controller.updateProfile);

// PATCH /api/auth/me/password
router.patch("/me/password", auth, controller.changePassword);

// DELETE /api/auth/me — soft-delete account
router.delete("/me", auth, controller.deleteAccount);

module.exports = router;
