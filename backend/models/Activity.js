/**
 * Activity Model
 * Logs all CRM activities (calls, emails, notes, meetings) tied to leads.
 */

const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        leadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lead',
            required: true,
        },
        dealId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Deal',
            default: null,
        },
        type: {
            type: String,
            enum: ['note', 'call', 'email', 'meeting', 'task', 'stage-change'],
            required: [true, 'Activity type is required'],
        },
        note: {
            type: String,
            required: [true, 'Activity note is required'],
            trim: true,
            maxlength: [1000, 'Note cannot exceed 1000 characters'],
        },
        outcome: {
            type: String,
            enum: ['positive', 'neutral', 'negative', null],
            default: null,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        nextFollowUp: {
            type: Date,
            default: null,
        },
        isCompleted: {
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
ActivitySchema.index({ leadId: 1, date: -1 });
ActivitySchema.index({ userId: 1 });
ActivitySchema.index({ date: -1 });

module.exports = mongoose.model('Activity', ActivitySchema);
