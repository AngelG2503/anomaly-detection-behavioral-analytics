const NetworkTraffic = require('../../models/anomaly/NetworkTraffic');
const Alert = require('../../models/anomaly/Alert');
const mlService = require('../../services/mlService');

// Submit network traffic data for analysis
exports.submitNetworkTraffic = async (req, res) => {
    try {
        const {
            source_ip,
            destination_ip,
            protocol,
            packet_size,
            connection_duration,
            port_number,
            packets_sent,
            packets_received,
            bytes_sent,
            bytes_received
        } = req.body;

        // Create network traffic record
        const networkTraffic = new NetworkTraffic({
            timestamp: new Date(),
            source_ip,
            destination_ip,
            protocol,
            packet_size,
            connection_duration,
            port_number,
            packets_sent,
            packets_received,
            bytes_sent,
            bytes_received,
            status: 'pending'
        });

        // Save to database
        await networkTraffic.save();

        // Prepare data for ML prediction
        const predictionData = {
            timestamp: networkTraffic.timestamp.toISOString(),
            source_ip,
            destination_ip,
            protocol,
            packet_size,
            connection_duration,
            port_number,
            packets_sent,
            packets_received,
            bytes_sent,
            bytes_received
        };

        // Call ML backend for prediction
        const prediction = await mlService.predictNetworkAnomaly(predictionData);

        if (prediction.success) {
            // Update network traffic with prediction results
            networkTraffic.is_anomaly = prediction.data.is_anomaly;
            networkTraffic.anomaly_score = prediction.data.anomaly_score;
            networkTraffic.threat_class = prediction.data.threat_class;
            networkTraffic.confidence = prediction.data.confidence;
            networkTraffic.prediction_timestamp = new Date();
            networkTraffic.status = 'analyzed';

            await networkTraffic.save();

            // If anomaly detected, create alert
            if (prediction.data.is_anomaly) {
                await createAlert('network', networkTraffic, prediction.data);
            }

            res.status(201).json({
                message: 'Network traffic analyzed successfully',
                data: networkTraffic,
                prediction: prediction.data
            });
        } else {
            // ML prediction failed, but data is saved
            res.status(201).json({
                message: 'Network traffic saved, but ML prediction failed',
                data: networkTraffic,
                error: prediction.error
            });
        }

    } catch (error) {
        console.error('Error submitting network traffic:', error);
        res.status(500).json({
            message: 'Error processing network traffic',
            error: error.message
        });
    }
};

// Get all network traffic records
exports.getAllNetworkTraffic = async (req, res) => {
    try {
        const { page = 1, limit = 50, anomaly_only } = req.query;

        const filter = {};
        if (anomaly_only === 'true') {
            filter.is_anomaly = true;
        }

        const networkTraffic = await NetworkTraffic.find(filter)
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await NetworkTraffic.countDocuments(filter);

        res.status(200).json({
            data: networkTraffic,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });

    } catch (error) {
        console.error('Error fetching network traffic:', error);
        res.status(500).json({
            message: 'Error fetching network traffic',
            error: error.message
        });
    }
};

// Get single network traffic record by ID
exports.getNetworkTrafficById = async (req, res) => {
    try {
        const networkTraffic = await NetworkTraffic.findById(req.params.id);

        if (!networkTraffic) {
            return res.status(404).json({
                message: 'Network traffic record not found'
            });
        }

        res.status(200).json({
            data: networkTraffic
        });

    } catch (error) {
        console.error('Error fetching network traffic:', error);
        res.status(500).json({
            message: 'Error fetching network traffic',
            error: error.message
        });
    }
};

// Get network traffic statistics
exports.getNetworkStatistics = async (req, res) => {
    try {
        const totalTraffic = await NetworkTraffic.countDocuments();
        const anomalies = await NetworkTraffic.countDocuments({ is_anomaly: true });
        const normal = totalTraffic - anomalies;

        // Get threat distribution
        const threatDistribution = await NetworkTraffic.aggregate([
            { $match: { is_anomaly: true, threat_class: { $ne: null } } },
            { $group: { _id: '$threat_class', count: { $sum: 1 } } }
        ]);

        // Recent anomalies (last 24 hours)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentAnomalies = await NetworkTraffic.countDocuments({
            is_anomaly: true,
            timestamp: { $gte: yesterday }
        });

        res.status(200).json({
            total_traffic: totalTraffic,
            anomalies: anomalies,
            normal: normal,
            anomaly_percentage: totalTraffic > 0 ? ((anomalies / totalTraffic) * 100).toFixed(2) : 0,
            threat_distribution: threatDistribution,
            recent_anomalies_24h: recentAnomalies
        });

    } catch (error) {
        console.error('Error fetching network statistics:', error);
        res.status(500).json({
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};

// Helper function to create alert
async function createAlert(type, data, prediction) {
    try {
        // Determine severity based on anomaly score
        let severity = 'low';
        if (prediction.anomaly_score > 0.8) severity = 'critical';
        else if (prediction.anomaly_score > 0.6) severity = 'high';
        else if (prediction.anomaly_score > 0.4) severity = 'medium';

        const alert = new Alert({
            alert_type: type,
            threat_class: prediction.threat_class || 'unknown',
            severity: severity,
            anomaly_score: prediction.anomaly_score,
            confidence: prediction.confidence,
            details: prediction.details,
            reference_id: data._id,
            reference_model: type === 'network' ? 'NetworkTraffic' : 'EmailCommunication',
            status: 'new',
            priority: severity === 'critical' ? 5 : severity === 'high' ? 4 : severity === 'medium' ? 3 : 2,
            detected_at: new Date()
        });

        await alert.save();
        console.log(`Alert created for ${type} anomaly: ${alert._id}`);
        
        return alert;
    } catch (error) {
        console.error('Error creating alert:', error);
    }
}

module.exports.createAlert = createAlert;
