/**
 * Admin Controller
 * Restricted to 'admin' role only.
 * Handles user management, stats, and analytics.
 */

const User = require('../models/User');
const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Activity = require('../models/Activity');
const { asyncHandler } = require('../middleware/errorHandler');
const { body } = require('express-validator');
const { sendVerificationEmail } = require('../utils/sendEmail');

// ─── Get Dashboard Stats ──────────────────────────────────────────────────────

/**
 * GET /api/admin/stats
 * Returns high-level CRM metrics for the admin dashboard.
 */
exports.getDashboardStats = asyncHandler(async (req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
        totalLeads,
        newLeadsThisMonth,
        totalUsers,
        pipelineStats,
        dealStats,
        monthlyRevenue,
        recentActivities,
        topPerformers,
    ] = await Promise.all([
        // Total active leads
        Lead.countDocuments({ isArchived: false }),

        // New leads this month
        Lead.countDocuments({ isArchived: false, createdAt: { $gte: startOfMonth } }),

        // Total active users
        User.countDocuments({ isActive: true }),

        // Leads by pipeline stage
        Lead.aggregate([
            { $match: { isArchived: false } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),

        // Deal stage breakdown with revenue
        Deal.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$stage',
                    count: { $sum: 1 },
                    revenue: { $sum: '$value' },
                },
            },
        ]),

        // Monthly revenue trend (last 6 months)
        Deal.aggregate([
            {
                $match: {
                    isActive: true,
                    stage: 'Won',
                    createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    revenue: { $sum: '$value' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]),

        // Recent activities (last 10)
        Activity.find()
            .populate('userId', 'name email')
            .populate('leadId', 'name company')
            .sort({ date: -1 })
            .limit(10)
            .lean(),

        // Top performers (most Won deals)
        Deal.aggregate([
            { $match: { isActive: true, stage: 'Won' } },
            {
                $group: {
                    _id: '$createdBy',
                    wonDeals: { $sum: 1 },
                    totalRevenue: { $sum: '$value' },
                },
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 0,
                    userId: '$_id',
                    name: '$user.name',
                    email: '$user.email',
                    wonDeals: 1,
                    totalRevenue: 1,
                },
            },
        ]),
    ]);

    // Compute total won revenue
    const wonDeal = dealStats.find((d) => d._id === 'Won');
    const totalWonRevenue = wonDeal ? wonDeal.revenue : 0;
    const totalDeals = dealStats.reduce((acc, d) => acc + d.count, 0);

    res.status(200).json({
        success: true,
        stats: {
            totalLeads,
            newLeadsThisMonth,
            totalUsers,
            totalDeals,
            totalWonRevenue,
        },
        pipeline: pipelineStats,
        dealStages: dealStats,
        monthlyRevenue,
        recentActivities,
        topPerformers,
    });
});

// ─── Get All Users ────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 */
exports.getUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, role, search, isActive } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
        User.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        count: users.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        users,
    });
});

// ─── Create User ──────────────────────────────────────────────────────────────

/**
 * POST /api/admin/users
 * Admin creates a team member.
 */
exports.createUserValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password min 8 characters'),
    body('role').isIn(['admin', 'sales']).withMessage('Role must be admin or sales'),
];

exports.createUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    const user = await User.create({ name, email, password, role, isVerified: true });

    // Send verification email (optional - account is auto-verified by admin)
    try {
        const token = user.generateEmailVerificationToken();
        await user.save({ validateBeforeSave: false });
        await sendVerificationEmail(user, token);
    } catch (e) {
        console.warn('⚠️  Could not send email:', e.message);
    }

    res.status(201).json({ success: true, user: { _id: user._id, name, email, role } });
});

// ─── Get User by ID ───────────────────────────────────────────────────────────

/**
 * GET /api/admin/users/:id
 */
exports.getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Fetch their lead and deal stats
    const [leadCount, dealCount] = await Promise.all([
        Lead.countDocuments({ assignedTo: user._id, isArchived: false }),
        Deal.countDocuments({ createdBy: user._id, isActive: true }),
    ]);

    res.status(200).json({ success: true, user: { ...user, leadCount, dealCount } });
});

// ─── Update User ──────────────────────────────────────────────────────────────

/**
 * PUT /api/admin/users/:id
 */
exports.updateUser = asyncHandler(async (req, res) => {
    const allowed = ['name', 'role', 'isActive'];
    const updates = {};
    allowed.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, user });
});

// ─── Delete User ──────────────────────────────────────────────────────────────

/**
 * DELETE /api/admin/users/:id
 * Soft-deletes by deactivating the account.
 */
exports.deleteUser = asyncHandler(async (req, res) => {
    // Prevent self-deletion
    if (String(req.params.id) === String(req.user._id)) {
        return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, message: 'User deactivated successfully.' });
});

// ─── Assign Lead ──────────────────────────────────────────────────────────────

/**
 * PUT /api/admin/leads/:id/assign
 */
exports.assignLead = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    // Verify target user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const lead = await Lead.findByIdAndUpdate(
        req.params.id,
        { assignedTo: userId },
        { new: true }
    ).populate('assignedTo', 'name email');

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });

    await Activity.create({
        userId: req.user._id,
        leadId: lead._id,
        type: 'note',
        note: `Lead assigned to ${user.name} by ${req.user.name}`,
    });

    res.status(200).json({ success: true, lead });
});

// ─── Performance Analytics ────────────────────────────────────────────────────

/**
 * GET /api/admin/analytics
 */
exports.getAnalytics = asyncHandler(async (req, res) => {
    const { period = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const [activityByType, leadsBySource, conversionRate, revenueTrend] = await Promise.all([
        // Activity breakdown by type
        Activity.aggregate([
            { $match: { date: { $gte: daysAgo } } },
            { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),

        // Leads by source
        Lead.aggregate([
            { $match: { isArchived: false } },
            { $group: { _id: '$source', count: { $sum: 1 } } },
        ]),

        // Win rate
        Deal.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    won: { $sum: { $cond: [{ $eq: ['$stage', 'Won'] }, 1, 0] } },
                },
            },
        ]),

        // Daily revenue for the period
        Deal.aggregate([
            { $match: { isActive: true, stage: 'Won', updatedAt: { $gte: daysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
                    revenue: { $sum: '$value' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
    ]);

    const conversion = conversionRate[0] || { total: 0, won: 0 };
    const winRate = conversion.total > 0
        ? ((conversion.won / conversion.total) * 100).toFixed(1)
        : 0;

    res.status(200).json({
        success: true,
        activityByType,
        leadsBySource,
        winRate: parseFloat(winRate),
        revenueTrend,
    });
});
