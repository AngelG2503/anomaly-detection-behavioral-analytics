const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    alert_type: {
        type: String,
        required: true,
        enum: ['network', 'email']
    },
    threat_class: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    anomaly_score: {
        type: Number,
        required: true
    },
    confidence: {
        type: Number,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    reference_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    reference_model: {
        type: String,
        required: true,
        enum: ['NetworkTraffic', 'EmailCommunication']
    },
    status: {
        type: String,
        enum: ['new', 'acknowledged', 'investigating', 'resolved', 'false_positive'],
        default: 'new'
    },
    priority: {
        type: Number,
        default: 1,
        min: 1,
        max: 5
    },
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    notes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        note: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    actions_taken: [{
        action: String,
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    detected_at: {
        type: Date,
        required: true,
        default: Date.now
    },
    acknowledged_at: {
        type: Date,
        default: null
    },
    resolved_at: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Indexes for efficient query
alertSchema.index({ status: 1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ detected_at: -1 });
alertSchema.index({ alert_type: 1 });

module.exports = mongoose.model('Alert', alertSchema);
