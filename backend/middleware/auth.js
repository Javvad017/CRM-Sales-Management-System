/**
 * Authentication & Authorization Middleware
 * - Verifies JWT access tokens
 * - Implements RBAC (Role-Based Access Control)
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Protect Route: Verify JWT Access Token ───────────────────────────────────
const protect = async (req, res, next) => {
    let token;

    // Extract token from Authorization header (Bearer) or cookie
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.',
        });
    }

    try {
        // Verify token signature and expiry
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch fresh user data (ensures deactivated users can't use old tokens)
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists.',
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account has been deactivated. Contact admin.',
            });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please refresh.',
                code: 'TOKEN_EXPIRED',
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Invalid token.',
        });
    }
};

// ─── RBAC: Restrict to Specific Roles ────────────────────────────────────────
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this resource.`,
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
