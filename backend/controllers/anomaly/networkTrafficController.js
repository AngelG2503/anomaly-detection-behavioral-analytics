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

    // Create network traffic record WITH userId
    const networkTraffic = new NetworkTraffic({
      userId: req.userId, // ✅ user ID from auth middleware
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
        await createAlert('network', networkTraffic, prediction.data, req.userId);
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


// Get all network traffic records - FILTER BY USER
exports.getAllNetworkTraffic = async (req, res) => {
  try {
    const { page = 1, limit = 50, anomaly_only } = req.query;

    const filter = { userId: req.userId }; // ✅ Filter by user
    if (anomaly_only === 'true') {
      filter.is_anomaly = true;
    }

    console.time('find networkTraffic');
    const networkTraffic = await NetworkTraffic.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip((page - 1) * limit)
      .exec();
    console.timeEnd('find networkTraffic');

    console.time('count networkTraffic');
    const count = await NetworkTraffic.countDocuments(filter);
    console.timeEnd('count networkTraffic');

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


// Get single network traffic record by ID - CHECK USER OWNERSHIP
exports.getNetworkTrafficById = async (req, res) => {
  try {
    const networkTraffic = await NetworkTraffic.findOne({
      _id: req.params.id,
      userId: req.userId
    });

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


// Get network traffic statistics - FILTER BY USER
exports.getNetworkStatistics = async (req, res) => {
  try {
    console.log('🔍 Debug: req.userId =', req.userId);
    const userId = req.userId;

    console.time('countDocuments totalTraffic');
    const totalTraffic = await NetworkTraffic.countDocuments({ userId });
    console.timeEnd('countDocuments totalTraffic');

    console.time('countDocuments anomalies');
    const anomalies = await NetworkTraffic.countDocuments({ userId, is_anomaly: true });
    console.timeEnd('countDocuments anomalies');

    const normal = totalTraffic - anomalies;

    console.time('aggregate threatDistribution');
    const threatDistribution = await NetworkTraffic.aggregate([
      { $match: { userId, is_anomaly: true, threat_class: { $ne: null } } },
      { $group: { _id: '$threat_class', count: { $sum: 1 } } }
    ]);
    console.timeEnd('aggregate threatDistribution');

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    console.time('countDocuments recentAnomalies');
    const recentAnomalies = await NetworkTraffic.countDocuments({
      userId,
      is_anomaly: true,
      timestamp: { $gte: yesterday }
    });
    console.timeEnd('countDocuments recentAnomalies');

    res.status(200).json({
      total_traffic: totalTraffic,
      anomalies,
      normal,
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
async function createAlert(type, data, prediction, userId) {
  try {
    // Determine severity based on anomaly score
    let severity = 'low';
    if (prediction.anomaly_score > 0.8) severity = 'critical';
    else if (prediction.anomaly_score > 0.6) severity = 'high';
    else if (prediction.anomaly_score > 0.4) severity = 'medium';

    const alert = new Alert({
      user_id: userId,
      alert_type: type,
      threat_class: prediction.threat_class || 'unknown',
      severity,
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


// Delete network traffic by ID - CHECK USER OWNERSHIP
exports.deleteNetworkTrafficById = async (req, res) => {
  try {
    const networkTraffic = await NetworkTraffic.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!networkTraffic) {
      return res.status(404).json({
        success: false,
        message: 'Network traffic record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Network traffic deleted successfully',
      data: networkTraffic
    });
  } catch (error) {
    console.error('Error deleting network traffic:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting network traffic',
      error: error.message
    });
  }
};


module.exports.createAlert = createAlert;
