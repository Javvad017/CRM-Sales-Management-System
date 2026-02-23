/**
 * JWT Token Utilities
 * Generates signed access and refresh tokens.
 */

const jwt = require('jsonwebtoken');

/**
 * Generate a short-lived JWT access token.
 * @param {string} userId - The user's MongoDB ObjectId
 * @returns {string} Signed JWT access token
 */
const generateAccessToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '15m',
    });
};

/**
 * Generate a long-lived JWT refresh token.
 * @param {string} userId - The user's MongoDB ObjectId
 * @returns {string} Signed JWT refresh token
 */
const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    });
};

/**
 * Send tokens to client via response body (and optionally HTTP-only cookies).
 * @param {Object} user - User document
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 */
const sendTokenResponse = (user, statusCode, res) => {
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Safe user object (no password)
    const safeUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
    };

    res.status(statusCode).json({
        success: true,
        accessToken,
        refreshToken,
        user: safeUser,
    });
};

module.exports = { generateAccessToken, generateRefreshToken, sendTokenResponse };
