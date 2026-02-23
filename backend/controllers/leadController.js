/**
 * Lead Controller
 * Full CRUD + filtering, sorting, pagination, and pipeline analytics.
 */

const { body, query } = require('express-validator');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const { asyncHandler } = require('../middleware/errorHandler');

// ─── Validation Rules ─────────────────────────────────────────────────────────

exports.createLeadValidation = [
    body('name').trim().notEmpty().withMessage('Lead name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('phone').optional().trim(),
    body('company').optional().trim(),
    body('status')
        .optional()
        .isIn(['New', 'Contacted', 'Demo', 'Proposal', 'Won', 'Lost'])
        .withMessage('Invalid status'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Invalid priority'),
    body('expectedValue').optional().isNumeric().withMessage('Value must be numeric'),
];

exports.updateLeadValidation = [
    body('name').optional().trim().notEmpty(),
    body('email').optional().trim().isEmail().normalizeEmail(),
    body('status').optional().isIn(['New', 'Contacted', 'Demo', 'Proposal', 'Won', 'Lost']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
];

// ─── Create Lead ──────────────────────────────────────────────────────────────

/**
 * POST /api/leads
 * Creates a new lead. Admin can assign to any user; sales can only assign to themselves.
 */
exports.createLead = asyncHandler(async (req, res) => {
    const leadData = { ...req.body };

    // Sales can only assign to themselves
    if (req.user.role === 'sales') {
        leadData.assignedTo = req.user._id;
    }

    const lead = await Lead.create(leadData);

    // Log activity
    await Activity.create({
        userId: req.user._id,
        leadId: lead._id,
        type: 'note',
        note: `Lead created by ${req.user.name}`,
    });

    res.status(201).json({ success: true, lead });
});

// ─── Get All Leads ────────────────────────────────────────────────────────────

/**
 * GET /api/leads
 * Returns paginated, filtered, sorted leads.
 * Sales users only see their own leads.
 */
exports.getLeads = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        status,
        priority,
        assignedTo,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = req.query;

    // Build filter
    const filter = { isArchived: false };

    // RBAC: Sales only see their own leads
    if (req.user.role === 'sales') {
        filter.assignedTo = req.user._id;
    } else if (assignedTo) {
        filter.assignedTo = assignedTo;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Text search on name, email, or company
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [leads, total] = await Promise.all([
        Lead.find(filter)
            .populate('assignedTo', 'name email avatar')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
        Lead.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        count: leads.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        leads,
    });
});

// ─── Get Single Lead ──────────────────────────────────────────────────────────

/**
 * GET /api/leads/:id
 */
exports.getLead = asyncHandler(async (req, res) => {
    const lead = await Lead.findById(req.params.id)
        .populate('assignedTo', 'name email')
        .lean();

    if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    // Sales users can only view their own leads
    if (req.user.role === 'sales' && String(lead.assignedTo?._id) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Fetch activities for this lead
    const activities = await Activity.find({ leadId: lead._id })
        .populate('userId', 'name')
        .sort({ date: -1 })
        .limit(20)
        .lean();

    res.status(200).json({ success: true, lead, activities });
});

// ─── Update Lead ──────────────────────────────────────────────────────────────

/**
 * PUT /api/leads/:id
 */
exports.updateLead = asyncHandler(async (req, res) => {
    let lead = await Lead.findById(req.params.id);

    if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    // Sales can only update their own leads
    if (req.user.role === 'sales' && String(lead.assignedTo) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const previousStatus = lead.status;
    lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    }).populate('assignedTo', 'name email');

    // Log stage change activity
    if (req.body.status && req.body.status !== previousStatus) {
        await Activity.create({
            userId: req.user._id,
            leadId: lead._id,
            type: 'stage-change',
            note: `Stage changed from "${previousStatus}" to "${req.body.status}"`,
        });
    }

    res.status(200).json({ success: true, lead });
});

// ─── Delete Lead ──────────────────────────────────────────────────────────────

/**
 * DELETE /api/leads/:id
 * Soft-deletes by archiving (admin only for hard delete).
 */
exports.deleteLead = asyncHandler(async (req, res) => {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    // Archive instead of hard delete for audit trail
    lead.isArchived = true;
    await lead.save();

    res.status(200).json({ success: true, message: 'Lead archived successfully.' });
});

// ─── Add Activity to Lead ─────────────────────────────────────────────────────

/**
 * POST /api/leads/:id/activities
 */
exports.addActivity = asyncHandler(async (req, res) => {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    const activity = await Activity.create({
        userId: req.user._id,
        leadId: lead._id,
        type: req.body.type,
        note: req.body.note,
        outcome: req.body.outcome,
        nextFollowUp: req.body.nextFollowUp,
    });

    // Update lead follow-up date if provided
    if (req.body.nextFollowUp) {
        lead.followUpDate = req.body.nextFollowUp;
        await lead.save();
    }

    await activity.populate('userId', 'name');

    res.status(201).json({ success: true, activity });
});

// ─── Pipeline Summary ─────────────────────────────────────────────────────────

/**
 * GET /api/leads/pipeline
 * Returns lead counts grouped by pipeline stage.
 */
exports.getPipelineSummary = asyncHandler(async (req, res) => {
    const matchStage = req.user.role === 'sales'
        ? { isArchived: false, assignedTo: req.user._id }
        : { isArchived: false };

    const pipeline = await Lead.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalValue: { $sum: '$expectedValue' },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ success: true, pipeline });
});
