/**
 * Input Validation Middleware
 * Uses express-validator for request body validation.
 * Returns structured validation errors.
 */

const { validationResult } = require('express-validator');

/**
 * Processes the result of express-validator chains.
 * If there are errors, returns 422 with field-level error messages.
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((err) => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }
    next();
};

module.exports = validate;
