/**
 * Error Handler Middleware
 * Centralized error handling for all Express errors.
 * Maps Mongoose and JWT errors to user-friendly responses.
 */

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', err);
    }

    // ── Mongoose: Bad ObjectId (e.g., invalid _id format)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // ── Mongoose: Duplicate key (e.g., unique email)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        statusCode = 409;
        message = `A record with that ${field} already exists.`;
    }

    // ── Mongoose: Validation error
    if (err.name === 'ValidationError') {
        statusCode = 422;
        message = Object.values(err.errors)
            .map((e) => e.message)
            .join(', ');
    }

    // ── JWT: Invalid or expired token
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token.';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token has expired.';
    }

    res.status(statusCode).json({
        success: false,
        message,
        // Only expose stack trace in development
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

// ── Async Error Wrapper (eliminates try/catch boilerplate in controllers)
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, asyncHandler };
