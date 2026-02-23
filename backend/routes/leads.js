/**
 * Lead Routes
 * All routes require authentication.
 * Role-based access enforced in controllers.
 */

const express = require('express');
const router = express.Router();
const {
    createLead,
    createLeadValidation,
    getLeads,
    getLead,
    updateLead,
    updateLeadValidation,
    deleteLead,
    addActivity,
    getPipelineSummary,
} = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All lead routes require authentication
router.use(protect);

// Pipeline summary
router.get('/pipeline', getPipelineSummary);

// Lead CRUD
router.route('/')
    .get(getLeads)
    .post(createLeadValidation, validate, createLead);

router.route('/:id')
    .get(getLead)
    .put(updateLeadValidation, validate, updateLead)
    .delete(authorize('admin'), deleteLead); // Only admin can archive

// Activity on a lead
router.post('/:id/activities', addActivity);

module.exports = router;
