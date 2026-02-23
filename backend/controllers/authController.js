/**
 * Authentication Controller
 * Handles register, login, logout, token refresh,
 * email verification, forgot/reset password, and profile.
 */

const crypto = require('crypto');
const { body } = require('express-validator');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateAccessToken, generateRefreshToken, sendTokenResponse } = require('../utils/generateToken');
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');

// ─── Validation Rules ─────────────────────────────────────────────────────────

exports.registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and a number'),
    body('role').optional().isIn(['admin', 'sales']).withMessage('Invalid role'),
];

exports.loginValidation = [
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
];

exports.forgotPasswordValidation = [
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
];

exports.resetPasswordValidation = [
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and a number'),
];

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Creates a new user and sends an email verification link.
 */
exports.register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    // Prevent non-admins from assigning the admin role
    const safeRole = req.user && req.user.role === 'admin' ? role : 'sales';

    const user = await User.create({ name, email, password, role: safeRole || 'sales' });

    // Generate email verification token
    const token = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email (non-blocking - don't fail registration if email fails)
    try {
        await sendVerificationEmail(user, token);
    } catch (emailErr) {
        console.error('⚠️  Verification email failed:', emailErr.message);
    }

    res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
    });
});

// ─── Verify Email ─────────────────────────────────────────────────────────────

/**
 * GET /api/auth/verify-email/:token
 */
exports.verifyEmail = asyncHandler(async (req, res) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({
            success: false,
            message: 'Invalid or expired verification link.',
        });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // Send welcome email
    try {
        await sendWelcomeEmail(user);
    } catch (emailErr) {
        console.error('⚠️  Welcome email failed:', emailErr.message);
    }

    res.status(200).json({ success: true, message: 'Email verified! You can now log in.' });
});

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Authenticates user and returns access + refresh tokens.
 */
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    // Update last login timestamp
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
});

// ─── Refresh Token ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/refresh-token
 * Issues a new access token using a valid refresh token.
 */
exports.refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh token required.' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
        }

        const newAccessToken = generateAccessToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        res.status(200).json({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }
});

// ─── Get Me ───────────────────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 */
exports.getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
});

// ─── Forgot Password ──────────────────────────────────────────────────────────

/**
 * POST /api/auth/forgot-password
 * Sends a password reset email to the user.
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return 200 to prevent user enumeration attacks
    if (!user) {
        return res.status(200).json({
            success: true,
            message: 'If that email is registered, a reset link has been sent.',
        });
    }

    const token = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
        await sendPasswordResetEmail(user, token);
    } catch (emailErr) {
        user.passwordResetToken = undefined;
        user.passwordResetExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({ success: false, message: 'Email could not be sent. Try again.' });
    }

    res.status(200).json({
        success: true,
        message: 'If that email is registered, a reset link has been sent.',
    });
});

// ─── Reset Password ───────────────────────────────────────────────────────────

/**
 * POST /api/auth/reset-password/:token
 * Resets the user's password using the reset token.
 */
exports.resetPassword = asyncHandler(async (req, res) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpire: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful. Please log in.' });
});

// ─── Update Profile ───────────────────────────────────────────────────────────

/**
 * PUT /api/auth/update-profile
 * Updates the authenticated user's own name/email.
 */
exports.updateProfile = asyncHandler(async (req, res) => {
    const { name, email } = req.body;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { name, email },
        { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, user });
});

// ─── Change Password ──────────────────────────────────────────────────────────

/**
 * PUT /api/auth/change-password
 */
exports.changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
});
