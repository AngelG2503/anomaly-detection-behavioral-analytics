const mongoose = require('mongoose');

const emailCommunicationSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    },
    sender_email: {
        type: String,
        required: true
    },
    receiver_email: {
        type: String,
        required: true
    },
    num_recipients: {
        type: Number,
        required: true
    },
    email_size: {
        type: Number,
        required: true
    },
    has_attachment: {
        type: Boolean,
        default: false
    },
    num_attachments: {
        type: Number,
        default: 0
    },
    subject_length: {
        type: Number,
        required: true
    },
    body_length: {
        type: Number,
        required: true
    },
    is_reply: {
        type: Boolean,
        default: false
    },
    is_forward: {
        type: Boolean,
        default: false
    },
    // ML Prediction Results
    is_anomaly: {
        type: Boolean,
        default: false
    },
    anomaly_score: {
        type: Number,
        default: 0
    },
    threat_class: {
        type: String,
        default: null
    },
    confidence: {
        type: Number,
        default: 0
    },
    prediction_timestamp: {
        type: Date,
        default: null
    },
    // User tracking (optional)
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Status
    status: {
        type: String,
        enum: ['pending', 'analyzed', 'reviewed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Index for faster queries
emailCommunicationSchema.index({ timestamp: -1 });
emailCommunicationSchema.index({ is_anomaly: 1 });
emailCommunicationSchema.index({ sender_email: 1 });

module.exports = mongoose.model('EmailCommunication', emailCommunicationSchema);
