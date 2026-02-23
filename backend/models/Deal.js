/**
 * Deal Model
 * Tracks financial deals associated with leads.
 * Contains deal value, stage, and close date.
 */

const mongoose = require('mongoose');

const DealSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Deal title is required'],
            trim: true,
            maxlength: [120, 'Title cannot exceed 120 characters'],
        },
        leadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lead',
            required: [true, 'Lead reference is required'],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        value: {
            type: Number,
            required: [true, 'Deal value is required'],
            min: [0, 'Deal value cannot be negative'],
        },
        currency: {
            type: String,
            default: 'USD',
            uppercase: true,
        },
        stage: {
            type: String,
            enum: ['New', 'Contacted', 'Demo', 'Proposal', 'Won', 'Lost'],
            default: 'New',
        },
        probability: {
            type: Number,
            min: 0,
            max: 100,
            default: 10,
        },
        closeDate: {
            type: Date,
            required: [true, 'Expected close date is required'],
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
DealSchema.index({ leadId: 1 });
DealSchema.index({ createdBy: 1 });
DealSchema.index({ stage: 1 });
DealSchema.index({ closeDate: 1 });

// ─── Virtual: Weighted Value ──────────────────────────────────────────────────
DealSchema.virtual('weightedValue').get(function () {
    return (this.value * this.probability) / 100;
});

// ─── Virtual: Days Until Close ────────────────────────────────────────────────
DealSchema.virtual('daysUntilClose').get(function () {
    return Math.ceil((this.closeDate - Date.now()) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Deal', DealSchema);
