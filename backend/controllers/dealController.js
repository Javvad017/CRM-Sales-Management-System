/**
 * Deal Controller
 * Manages sales deals tied to leads.
 * Supports CRUD, stage updates, and revenue calculations.
 */

const { body } = require('express-validator');
const Deal = require('../models/Deal');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const { asyncHandler } = require('../middleware/errorHandler');

// ─── Validation Rules ─────────────────────────────────────────────────────────

exports.createDealValidation = [
    body('title').trim().notEmpty().withMessage('Deal title is required'),
    body('leadId').isMongoId().withMessage('Valid lead ID is required'),
    body('value').isNumeric().isFloat({ min: 0 }).withMessage('Valid deal value required'),
    body('closeDate').isISO8601().toDate().withMessage('Valid close date required'),
    body('stage')
        .optional()
        .isIn(['New', 'Contacted', 'Demo', 'Proposal', 'Won', 'Lost'])
        .withMessage('Invalid deal stage'),
    body('probability').optional().isInt({ min: 0, max: 100 }),
];

exports.updateDealValidation = [
    body('value').optional().isNumeric().isFloat({ min: 0 }),
    body('stage').optional().isIn(['New', 'Contacted', 'Demo', 'Proposal', 'Won', 'Lost']),
    body('probability').optional().isInt({ min: 0, max: 100 }),
    body('closeDate').optional().isISO8601().toDate(),
];

// ─── Create Deal ──────────────────────────────────────────────────────────────

/**
 * POST /api/deals
 */
exports.createDeal = asyncHandler(async (req, res) => {
    // Verify lead exists
    const lead = await Lead.findById(req.body.leadId);
    if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    const deal = await Deal.create({ ...req.body, createdBy: req.user._id });

    // Log activity
    await Activity.create({
        userId: req.user._id,
        leadId: lead._id,
        dealId: deal._id,
        type: 'note',
        note: `Deal "${deal.title}" created — Value: $${deal.value}`,
    });

    await deal.populate([
        { path: 'leadId', select: 'name email company' },
        { path: 'createdBy', select: 'name email' },
    ]);

    res.status(201).json({ success: true, deal });
});

// ─── Get All Deals ────────────────────────────────────────────────────────────

/**
 * GET /api/deals
 */
exports.getDeals = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, stage, leadId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = { isActive: true };
    if (req.user.role === 'sales') filter.createdBy = req.user._id;
    if (stage) filter.stage = stage;
    if (leadId) filter.leadId = leadId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [deals, total] = await Promise.all([
        Deal.find(filter)
            .populate('leadId', 'name email company')
            .populate('createdBy', 'name email')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
        Deal.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        count: deals.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        deals,
    });
});

// ─── Get Single Deal ──────────────────────────────────────────────────────────

/**
 * GET /api/deals/:id
 */
exports.getDeal = asyncHandler(async (req, res) => {
    const deal = await Deal.findById(req.params.id)
        .populate('leadId', 'name email company')
        .populate('createdBy', 'name email');

    if (!deal) {
        return res.status(404).json({ success: false, message: 'Deal not found.' });
    }

    if (req.user.role === 'sales' && String(deal.createdBy._id) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, deal });
});

// ─── Update Deal ──────────────────────────────────────────────────────────────

/**
 * PUT /api/deals/:id
 */
exports.updateDeal = asyncHandler(async (req, res) => {
    let deal = await Deal.findById(req.params.id);

    if (!deal) {
        return res.status(404).json({ success: false, message: 'Deal not found.' });
    }

    if (req.user.role === 'sales' && String(deal.createdBy) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const previousStage = deal.stage;
    deal = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        .populate('leadId', 'name email company')
        .populate('createdBy', 'name email');

    // Log stage change
    if (req.body.stage && req.body.stage !== previousStage) {
        await Activity.create({
            userId: req.user._id,
            leadId: deal.leadId._id,
            dealId: deal._id,
            type: 'stage-change',
            note: `Deal stage changed from "${previousStage}" to "${req.body.stage}"`,
        });

        // Keep lead status in sync with deal stage
        await Lead.findByIdAndUpdate(deal.leadId._id, { status: req.body.stage });
    }

    res.status(200).json({ success: true, deal });
});

// ─── Delete Deal ──────────────────────────────────────────────────────────────

/**
 * DELETE /api/deals/:id
 */
exports.deleteDeal = asyncHandler(async (req, res) => {
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
        return res.status(404).json({ success: false, message: 'Deal not found.' });
    }

    deal.isActive = false;
    await deal.save();

    res.status(200).json({ success: true, message: 'Deal deleted successfully.' });
});

// ─── Revenue Metrics ──────────────────────────────────────────────────────────

/**
 * GET /api/deals/metrics
 * Returns total, won, and pipeline revenue by stage.
 */
exports.getDealMetrics = asyncHandler(async (req, res) => {
    const matchStage = req.user.role === 'sales'
        ? { isActive: true, createdBy: req.user._id }
        : { isActive: true };

    const [stageSummary, totals] = await Promise.all([
        Deal.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$stage',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$value' },
                    avgValue: { $avg: '$value' },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        Deal.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$value' },
                    wonRevenue: { $sum: { $cond: [{ $eq: ['$stage', 'Won'] }, '$value', 0] } },
                    lostRevenue: { $sum: { $cond: [{ $eq: ['$stage', 'Lost'] }, '$value', 0] } },
                    totalDeals: { $sum: 1 },
                    wonDeals: { $sum: { $cond: [{ $eq: ['$stage', 'Won'] }, 1, 0] } },
                },
            },
        ]),
    ]);

    res.status(200).json({
        success: true,
        summary: stageSummary,
        totals: totals[0] || {
            totalRevenue: 0,
            wonRevenue: 0,
            lostRevenue: 0,
            totalDeals: 0,
            wonDeals: 0,
        },
    });
});
