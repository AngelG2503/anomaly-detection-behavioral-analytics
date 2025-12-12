const axios = require('axios');
const EmailCommunication = require('../../models/anomaly/EmailCommunication');
const Alert = require('../../models/anomaly/Alert');
const mlService = require('../../services/mlService');
const { createAlert } = require('./networkTrafficController');

// Submit email data for analysis
exports.submitEmailCommunication = async (req, res) => {
    try {
        const emailData = req.body;
        
        console.log('Received email data:', emailData);
        
        // Calculate actual body length
        const bodyLength = emailData.body_length || emailData.email_size || 0;
        
        // Prepare data for ML backend
        const mlPayload = {
            sender_email: emailData.sender,
            receiver_email: emailData.recipient,
            subject_length: emailData.subject ? emailData.subject.length : 0,
            body_length: bodyLength,  // ✅ FIXED
            num_recipients: emailData.num_recipients || 1,
            email_size: emailData.email_size || 0,
            has_attachment: emailData.attachment_count > 0,
            num_attachments: emailData.attachment_count || 0,
            is_reply: emailData.subject && emailData.subject.startsWith('Re:'), // ✅ DETECT REPLIES
            is_forward: emailData.subject && emailData.subject.startsWith('Fwd:'), // ✅ DETECT FORWARDS
            timestamp: new Date(emailData.time_sent).toISOString()
        };
        
        console.log('ML Payload:', mlPayload);
        
        // Port 8000 - KEEP AS IS
        const mlResponse = await axios.post(
  'https://anomaly-detection-ml-backend.onrender.com/predict/email',
  mlPayload
);

        console.log('ML Response:', mlResponse.data);
        
        // Save to database
        const email = new EmailCommunication({
            user_id: req.userId,
            timestamp: new Date(),
            sender_email: emailData.sender,
            receiver_email: emailData.recipient,
            num_recipients: emailData.num_recipients || 1,
            email_size: emailData.email_size || 0,
            has_attachment: emailData.attachment_count > 0,
            num_attachments: emailData.attachment_count || 0,
            subject_length: emailData.subject ? emailData.subject.length : 0,
            body_length: bodyLength,  // ✅ FIXED
            is_reply: mlPayload.is_reply,
            is_forward: mlPayload.is_forward,
            is_anomaly: mlResponse.data.is_anomaly,
            anomaly_score: mlResponse.data.anomaly_score,
            threat_class: mlResponse.data.threat_class || null,
            confidence: mlResponse.data.confidence || 0,
            prediction_timestamp: new Date(mlResponse.data.timestamp),
            status: mlResponse.data.is_anomaly ? 'analyzed' : 'analyzed'
        });
        
        await email.save();
        
        console.log('Email saved successfully:', email._id);
        
        if (mlResponse.data.is_anomaly) {
            await createAlert('email', email, mlResponse.data, req.userId);
        }
        
        res.json({ 
            success: true, 
            data: email,
            prediction: mlResponse.data 
        });
    } catch (error) {
        console.error('Error in submitEmailCommunication:', error.message);
        console.error('Error details:', error.response?.data);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: error.response?.data || error.errors
        });
    }
};

// Get all email communications - FILTER BY USER
exports.getAllEmails = async (req, res) => {
    try {
        const { anomaly_only } = req.query;
        let query = { user_id: req.userId }; // ✅ ADD THIS - only user's emails
        
        if (anomaly_only === 'true') {
            query.is_anomaly = true;
        }
        
        const emails = await EmailCommunication.find(query).sort({ timestamp: -1 });
        
        // Transform data for frontend
        const transformedEmails = emails.map(email => ({
            _id: email._id,
            sender: email.sender_email,
            recipient: email.receiver_email,
            subject: `Email (${email.subject_length} chars)`,
            email_size: email.body_length,
            attachment_count: email.attachment_count,
            has_links: email.has_links,
            time_sent: email.time_sent,
            num_recipients: email.num_recipients,
            is_anomaly: email.is_anomaly,
            anomaly_score: email.anomaly_score,
            threat_class: email.threat_class,
            confidence: email.confidence,
            timestamp: email.timestamp
        }));
        
        res.json({ 
            success: true, 
            data: transformedEmails,
            count: transformedEmails.length 
        });
    } catch (error) {
        console.error('Error in getAllEmails:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Get single email by ID - CHECK USER OWNERSHIP
exports.getEmailById = async (req, res) => {
    try {
        const email = await EmailCommunication.findOne({
            _id: req.params.id,
            user_id: req.userId // ✅ ADD THIS - only user's data
        });

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

// Get email statistics - FILTER BY USER
exports.getEmailStatistics = async (req, res) => {
    try {
        const userId = req.userId; // ✅ ADD THIS

        const totalEmails = await EmailCommunication.countDocuments({ user_id: userId });
        const anomalies = await EmailCommunication.countDocuments({ user_id: userId, is_anomaly: true });
        const normal = totalEmails - anomalies;

        // Get threat distribution - FILTER BY USER
        const threatDistribution = await EmailCommunication.aggregate([
            { $match: { user_id: userId, is_anomaly: true, threat_class: { $ne: null } } }, // ✅ ADD userId
            { $group: { _id: '$threat_class', count: { $sum: 1 } } }
        ]);

        // Recent anomalies (last 24 hours) - FILTER BY USER
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentAnomalies = await EmailCommunication.countDocuments({
            user_id: userId, // ✅ ADD THIS
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

// Delete email by ID - CHECK USER OWNERSHIP
exports.deleteEmailById = async (req, res) => {
    try {
        const email = await EmailCommunication.findOneAndDelete({
            _id: req.params.id,
            user_id: req.userId // ✅ ADD THIS - only user's data
        });

        if (!email) {
            return res.status(404).json({
                success: false,
                message: 'Email record not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Email deleted successfully',
            data: email
        });

    } catch (error) {
        console.error('Error deleting email:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting email',
            error: error.message
        });
    }
};
