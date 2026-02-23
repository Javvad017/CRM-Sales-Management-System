/**
 * Auth Routes
 * Public: register, login, verification, password reset
 * Protected: me, refresh, profile updates
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    register,
    registerValidation,
    login,
    loginValidation,
    verifyEmail,
    refreshToken,
    getMe,
    forgotPassword,
    forgotPasswordValidation,
    resetPassword,
    resetPasswordValidation,
    updateProfile,
    changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

// ── Rate Limiters ─────────────────────────────────────────────────────────────

// Strict limiter for auth endpoints (prevents brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Moderate limiter for password reset
const passwordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { success: false, message: 'Too many password reset attempts. Try again in 1 hour.' },
});

// ── Public Routes ─────────────────────────────────────────────────────────────

router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', passwordLimiter, forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password/:token', passwordLimiter, resetPasswordValidation, validate, resetPassword);

// ── Protected Routes ──────────────────────────────────────────────────────────

router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
