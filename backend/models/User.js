/**
 * User Model
 * Handles user authentication, roles, and email verification.
 * Passwords are hashed with bcrypt (12 rounds) before saving.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [60, 'Name cannot exceed 60 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false, // Never return password in queries by default
        },
        role: {
            type: String,
            enum: ['admin', 'sales'],
            default: 'sales',
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        // Email verification token
        emailVerificationToken: String,
        emailVerificationExpire: Date,

        // Password reset token
        passwordResetToken: String,
        passwordResetExpire: Date,

        // Refresh token (hashed)
        refreshToken: {
            type: String,
            select: false,
        },

        lastLogin: Date,
        avatar: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true, // createdAt, updatedAt
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

// ─── Pre-save Hook: Hash Password ─────────────────────────────────────────────
UserSchema.pre('save', async function (next) {
    // Only hash if password was actually modified
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12); // 12 rounds for production security
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// ─── Instance Method: Compare Password ───────────────────────────────────────
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance Method: Generate Email Verification Token ──────────────────────
UserSchema.methods.generateEmailVerificationToken = function () {
    const token = crypto.randomBytes(32).toString('hex');
    // Hash and store the token
    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    return token; // Return raw token to send via email
};

// ─── Instance Method: Generate Password Reset Token ──────────────────────────
UserSchema.methods.generatePasswordResetToken = function () {
    const token = crypto.randomBytes(32).toString('hex');
    // Hash and store the token
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    this.passwordResetExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    return token;
};

module.exports = mongoose.model('User', UserSchema);
