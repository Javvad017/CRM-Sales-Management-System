/**
 * Admin Routes
 * All routes restricted to 'admin' role only.
 */

const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getUsers,
    createUser,
    createUserValidation,
    getUser,
    updateUser,
    deleteUser,
    assignLead,
    getAnalytics,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All admin routes require auth + admin role
router.use(protect, authorize('admin'));

// Dashboard & Analytics
router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);

// User Management
router.route('/users')
    .get(getUsers)
    .post(createUserValidation, validate, createUser);

router.route('/users/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser);

// Lead Assignment
router.put('/leads/:id/assign', assignLead);

module.exports = router;
