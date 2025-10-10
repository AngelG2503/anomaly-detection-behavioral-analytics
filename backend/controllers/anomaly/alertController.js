const Alert = require('../../models/anomaly/Alert');
const NetworkTraffic = require('../../models/anomaly/NetworkTraffic');
const EmailCommunication = require('../../models/anomaly/EmailCommunication');


// Get all alerts
exports.getAllAlerts = async (req, res) => {
    try {
        const { page = 1, limit = 50, status, severity, alert_type } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (severity) filter.severity = severity;
        if (alert_type) filter.alert_type = alert_type;

        const alerts = await Alert.find(filter)
            .populate('assigned_to', 'name email')
            .sort({ detected_at: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Alert.countDocuments(filter);

        res.status(200).json({
            data: alerts,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });

    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({
            message: 'Error fetching alerts',
            error: error.message
        });
    }
};

// Get single alert by ID with full details
exports.getAlertById = async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id)
            .populate('assigned_to', 'name email')
            .populate('notes.user', 'name email')
            .populate('actions_taken.user', 'name email');

        if (!alert) {
            return res.status(404).json({
                message: 'Alert not found'
            });
        }

        // Get the original data (network or email)
        let originalData = null;
        if (alert.reference_model === 'NetworkTraffic') {
            originalData = await NetworkTraffic.findById(alert.reference_id);
        } else if (alert.reference_model === 'EmailCommunication') {
            originalData = await EmailCommunication.findById(alert.reference_id);
        }

        res.status(200).json({
            alert: alert,
            original_data: originalData
        });

    } catch (error) {
        console.error('Error fetching alert:', error);
        res.status(500).json({
            message: 'Error fetching alert',
            error: error.message
        });
    }
};

// Update alert status
exports.updateAlertStatus = async (req, res) => {
    try {
        const { status, assigned_to } = req.body;
        const alertId = req.params.id;

        const alert = await Alert.findById(alertId);

        if (!alert) {
            return res.status(404).json({
                message: 'Alert not found'
            });
        }

        // Update status
        if (status) {
            alert.status = status;

            // Update timestamps based on status
            if (status === 'acknowledged' && !alert.acknowledged_at) {
                alert.acknowledged_at = new Date();
            }
            if (status === 'resolved' && !alert.resolved_at) {
                alert.resolved_at = new Date();
            }
        }

        // Assign alert to user
        if (assigned_to) {
            alert.assigned_to = assigned_to;
        }

        await alert.save();

        res.status(200).json({
            message: 'Alert updated successfully',
            data: alert
        });

    } catch (error) {
        console.error('Error updating alert:', error);
        res.status(500).json({
            message: 'Error updating alert',
            error: error.message
        });
    }
};

// Add note to alert
exports.addNoteToAlert = async (req, res) => {
    try {
        const { note, user_id } = req.body;
        const alertId = req.params.id;

        const alert = await Alert.findById(alertId);

        if (!alert) {
            return res.status(404).json({
                message: 'Alert not found'
            });
        }

        alert.notes.push({
            user: user_id,
            note: note,
            timestamp: new Date()
        });

        await alert.save();

        res.status(200).json({
            message: 'Note added successfully',
            data: alert
        });

    } catch (error) {
        console.error('Error adding note:', error);
        res.status(500).json({
            message: 'Error adding note',
            error: error.message
        });
    }
};

// Add action to alert
exports.addActionToAlert = async (req, res) => {
    try {
        const { action, user_id } = req.body;
        const alertId = req.params.id;

        const alert = await Alert.findById(alertId);

        if (!alert) {
            return res.status(404).json({
                message: 'Alert not found'
            });
        }

        alert.actions_taken.push({
            action: action,
            user: user_id,
            timestamp: new Date()
        });

        await alert.save();

        res.status(200).json({
            message: 'Action added successfully',
            data: alert
        });

    } catch (error) {
        console.error('Error adding action:', error);
        res.status(500).json({
            message: 'Error adding action',
            error: error.message
        });
    }
};

// Get alert statistics
exports.getAlertStatistics = async (req, res) => {
    try {
        const totalAlerts = await Alert.countDocuments();
        const newAlerts = await Alert.countDocuments({ status: 'new' });
        const acknowledgedAlerts = await Alert.countDocuments({ status: 'acknowledged' });
        const investigatingAlerts = await Alert.countDocuments({ status: 'investigating' });
        const resolvedAlerts = await Alert.countDocuments({ status: 'resolved' });

        // Severity distribution
        const severityDistribution = await Alert.aggregate([
            { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]);

        // Threat type distribution
        const threatDistribution = await Alert.aggregate([
            { $group: { _id: '$threat_class', count: { $sum: 1 } } }
        ]);

        // Alert type distribution
        const typeDistribution = await Alert.aggregate([
            { $group: { _id: '$alert_type', count: { $sum: 1 } } }
        ]);

        // Recent alerts (last 24 hours)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentAlerts = await Alert.countDocuments({
            detected_at: { $gte: yesterday }
        });

        res.status(200).json({
            total_alerts: totalAlerts,
            by_status: {
                new: newAlerts,
                acknowledged: acknowledgedAlerts,
                investigating: investigatingAlerts,
                resolved: resolvedAlerts
            },
            severity_distribution: severityDistribution,
            threat_distribution: threatDistribution,
            type_distribution: typeDistribution,
            recent_alerts_24h: recentAlerts
        });

    } catch (error) {
        console.error('Error fetching alert statistics:', error);
        res.status(500).json({
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};

// Delete alert (admin only)
exports.deleteAlert = async (req, res) => {
    try {
        const alert = await Alert.findByIdAndDelete(req.params.id);

        if (!alert) {
            return res.status(404).json({
                message: 'Alert not found'
            });
        }

        res.status(200).json({
            message: 'Alert deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting alert:', error);
        res.status(500).json({
            message: 'Error deleting alert',
            error: error.message
        });
    }
};
