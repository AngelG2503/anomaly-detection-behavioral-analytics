const mongoose = require('mongoose');

const networkTrafficSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    },
    source_ip: {
        type: String,
        required: true
    },
    destination_ip: {
        type: String,
        required: true
    },
    protocol: {
        type: String,
        required: true,
        enum: ['tcp', 'udp', 'icmp', 'http', 'https', 'other']
    },
    packet_size: {
        type: Number,
        required: true
    },
    connection_duration: {
        type: Number,
        required: true
    },
    port_number: {
        type: Number,
        required: true
    },
    packets_sent: {
        type: Number,
        required: true
    },
    packets_received: {
        type: Number,
        required: true
    },
    bytes_sent: {
        type: Number,
        required: true
    },
    bytes_received: {
        type: Number,
        required: true
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
    // User tracking - MAKE IT REQUIRED
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // ✅ CHANGED from optional to required
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
networkTrafficSchema.index({ timestamp: -1 });
networkTrafficSchema.index({ is_anomaly: 1 });
networkTrafficSchema.index({ source_ip: 1 });
networkTrafficSchema.index({ user_id: 1 }); // ✅ ADD index for user_id

module.exports = mongoose.model('NetworkTraffic', networkTrafficSchema);
