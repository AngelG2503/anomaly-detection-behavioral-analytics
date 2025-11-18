const express = require('express');
const router = express.Router();

// In-memory storage (you can switch to MongoDB later)
let emailAlerts = [];
let networkStats = [];

// =============================
// Email Monitor Endpoint
// =============================
router.post('/emails/monitor', (req, res) => {
  try {
    const { email, anomalies, timestamp, severity } = req.body;
    
    console.log(`📧 Email anomaly received: ${email.subject}`);
    console.log(`   Anomalies: ${anomalies.length}`);
    
    const alert = {
      id: Date.now(),
      type: 'email',
      email,
      anomalies,
      timestamp,
      severity,
      status: 'new'
    };
    
    emailAlerts.unshift(alert); // Add to beginning
    
    // Keep only last 100 alerts
    if (emailAlerts.length > 100) {
      emailAlerts = emailAlerts.slice(0, 100);
    }
    
    res.json({ success: true, message: 'Email anomaly recorded', alertId: alert.id });
  } catch (error) {
    console.error('Error recording email anomaly:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================
// Network Monitor Endpoint
// =============================
router.post('/network/monitor', (req, res) => {
  try {
    const { timestamp, total_packets, protocols, top_ports, top_ips, suspicious_activity } = req.body;
    
    console.log(`🌐 Network stats received: ${total_packets} packets`);
    if (suspicious_activity && suspicious_activity.length > 0) {
      console.log(`   ⚠️ Suspicious activities: ${suspicious_activity.length}`);
    }
    
    const stats = {
      id: Date.now(),
      type: 'network',
      timestamp,
      total_packets,
      protocols,
      top_ports,
      top_ips,
      suspicious_activity,
      status: suspicious_activity && suspicious_activity.length > 0 ? 'alert' : 'normal'
    };
    
    networkStats.unshift(stats); // Add to beginning
    
    // Keep only last 100 stats
    if (networkStats.length > 100) {
      networkStats = networkStats.slice(0, 100);
    }
    
    res.json({ success: true, message: 'Network stats recorded', statsId: stats.id });
  } catch (error) {
    console.error('Error recording network stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================
// Get Email Alerts
// =============================
router.get('/emails/alerts', (req, res) => {
  try {
    res.json({
      success: true,
      count: emailAlerts.length,
      alerts: emailAlerts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================
// Get Network Stats
// =============================
router.get('/network/stats', (req, res) => {
  try {
    res.json({
      success: true,
      count: networkStats.length,
      stats: networkStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================
// Get All Alerts (Combined)
// =============================
router.get('/alerts/all', (req, res) => {
  try {
    const allAlerts = [
      ...emailAlerts.map(alert => ({ ...alert, source: 'email' })),
      ...networkStats
        .filter(stat => stat.suspicious_activity && stat.suspicious_activity.length > 0)
        .map(stat => ({ ...stat, source: 'network' }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      success: true,
      count: allAlerts.length,
      alerts: allAlerts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================
// Clear All Alerts (for testing)
// =============================
router.delete('/alerts/clear', (req, res) => {
  emailAlerts = [];
  networkStats = [];
  res.json({ success: true, message: 'All alerts cleared' });
});

module.exports = router;
