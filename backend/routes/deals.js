/**
 * Deal Routes
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const {
    createDeal,
    createDealValidation,
    getDeals,
    getDeal,
    updateDeal,
    updateDealValidation,
    deleteDeal,
    getDealMetrics,
} = require('../controllers/dealController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

// Metrics endpoint
router.get('/metrics', getDealMetrics);

// Deal CRUD
router.route('/')
    .get(getDeals)
    .post(createDealValidation, validate, createDeal);

router.route('/:id')
    .get(getDeal)
    .put(updateDealValidation, validate, updateDeal)
    .delete(authorize('admin'), deleteDeal);

module.exports = router;
