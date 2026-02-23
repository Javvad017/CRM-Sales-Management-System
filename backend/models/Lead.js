/**
 * Lead Model
 * Represents a potential customer in the CRM pipeline.
 * Tracks contact information, pipeline stage, and assignment.
 */

const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Lead name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        phone: {
            type: String,
            trim: true,
            match: [/^[+\d\s\-().]{7,20}$/, 'Please enter a valid phone number'],
        },
        company: {
            type: String,
            trim: true,
            maxlength: [100, 'Company name cannot exceed 100 characters'],
        },
        website: {
            type: String,
            trim: true,
        },
        source: {
            type: String,
            enum: ['website', 'referral', 'cold-call', 'email', 'social-media', 'other'],
            default: 'other',
        },
        // Sales pipeline stage
        status: {
            type: String,
            enum: ['New', 'Contacted', 'Demo', 'Proposal', 'Won', 'Lost'],
            default: 'New',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
        },
        // Assigned sales user
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        // Notes for the lead
        description: {
            type: String,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        // Follow-up date
        followUpDate: {
            type: Date,
            default: null,
        },
        expectedValue: {
            type: Number,
            min: [0, 'Value cannot be negative'],
            default: 0,
        },
        tags: [{ type: String, trim: true }],
        isArchived: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
LeadSchema.index({ status: 1 });
LeadSchema.index({ assignedTo: 1 });
LeadSchema.index({ email: 1 });
LeadSchema.index({ createdAt: -1 });

// ─── Virtual: Days Since Created ─────────────────────────────────────────────
LeadSchema.virtual('daysSinceCreated').get(function () {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Lead', LeadSchema);
