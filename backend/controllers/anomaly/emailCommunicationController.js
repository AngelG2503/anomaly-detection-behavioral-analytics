const EmailCommunication = require('../../models/anomaly/EmailCommunication');
const Alert = require('../../models/anomaly/Alert');
const mlService = require('../../services/mlService');
const { createAlert } = require('./networkTrafficController');


// Submit email data for analysis
exports.submitEmailCommunication = async (req, res) => {
    try {
        const {
            sender_email,
            receiver_email,
            num_recipients,
            email_size,
            has_attachment,
            num_attachments,
            subject_length,
            body_length,
            is_reply,
            is_forward
        } = req.body;

        // Create email communication record
        const emailComm = new EmailCommunication({
            timestamp: new Date(),
            sender_email,
            receiver_email,
            num_recipients,
            email_size,
            has_attachment,
            num_attachments,
            subject_length,
            body_length,
            is_reply,
            is_forward,
            status: 'pending'
        });

        // Save to database
        await emailComm.save();

        // Prepare data for ML prediction
        const predictionData = {
            timestamp: emailComm.timestamp.toISOString(),
            sender_email,
            receiver_email,
            num_recipients,
            email_size,
            has_attachment,
            num_attachments,
            subject_length,
            body_length,
            is_reply,
            is_forward
        };

        // Call ML backend for prediction
        const prediction = await mlService.predictEmailAnomaly(predictionData);

        if (prediction.success) {
            // Update email with prediction results
            emailComm.is_anomaly = prediction.data.is_anomaly;
            emailComm.anomaly_score = prediction.data.anomaly_score;
            emailComm.threat_class = prediction.data.threat_class;
            emailComm.confidence = prediction.data.confidence;
            emailComm.prediction_timestamp = new Date();
            emailComm.status = 'analyzed';

            await emailComm.save();

            // If anomaly detected, create alert
            if (prediction.data.is_anomaly) {
                await createAlert('email', emailComm, prediction.data);
            }

            res.status(201).json({
                message: 'Email analyzed successfully',
                data: emailComm,
                prediction: prediction.data
            });
        } else {
            // ML prediction failed, but data is saved
            res.status(201).json({
                message: 'Email saved, but ML prediction failed',
                data: emailComm,
                error: prediction.error
            });
        }

    } catch (error) {
        console.error('Error submitting email:', error);
        res.status(500).json({
            message: 'Error processing email',
            error: error.message
        });
    }
};

// Get all email communications
exports.getAllEmails = async (req, res) => {
    try {
        const { page = 1, limit = 50, anomaly_only } = req.query;

        const filter = {};
        if (anomaly_only === 'true') {
            filter.is_anomaly = true;
        }

        const emails = await EmailCommunication.find(filter)
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await EmailCommunication.countDocuments(filter);

        res.status(200).json({
            data: emails,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });

    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({
            message: 'Error fetching emails',
            error: error.message
        });
    }
};

// Get single email by ID
exports.getEmailById = async (req, res) => {
    try {
        const email = await EmailCommunication.findById(req.params.id);

        if (!email) {
            return res.status(404).json({
                message: 'Email record not found'
            });
        }

        res.status(200).json({
            data: email
        });

    } catch (error) {
        console.error('Error fetching email:', error);
        res.status(500).json({
            message: 'Error fetching email',
            error: error.message
        });
    }
};

// Get email statistics
exports.getEmailStatistics = async (req, res) => {
    try {
        const totalEmails = await EmailCommunication.countDocuments();
        const anomalies = await EmailCommunication.countDocuments({ is_anomaly: true });
        const normal = totalEmails - anomalies;

        // Get threat distribution
        const threatDistribution = await EmailCommunication.aggregate([
            { $match: { is_anomaly: true, threat_class: { $ne: null } } },
            { $group: { _id: '$threat_class', count: { $sum: 1 } } }
        ]);

        // Recent anomalies (last 24 hours)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentAnomalies = await EmailCommunication.countDocuments({
            is_anomaly: true,
            timestamp: { $gte: yesterday }
        });

        res.status(200).json({
            total_emails: totalEmails,
            anomalies: anomalies,
            normal: normal,
            anomaly_percentage: totalEmails > 0 ? ((anomalies / totalEmails) * 100).toFixed(2) : 0,
            threat_distribution: threatDistribution,
            recent_anomalies_24h: recentAnomalies
        });

    } catch (error) {
        console.error('Error fetching email statistics:', error);
        res.status(500).json({
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};
