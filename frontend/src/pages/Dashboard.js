import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Shield, TrendingUp, Network, Mail } from 'lucide-react';
import { networkAPI, emailAPI, alertAPI } from '../services/api'; // ✅ Use our API service
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    network: { total_traffic: 0, anomalies: 0, anomaly_percentage: 0 },
    email: { total_emails: 0, anomalies: 0, anomaly_percentage: 0 },
    loading: true
  });

  const [recentAlerts, setRecentAlerts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Use API service with auth token automatically
      const [networkRes, emailRes, networkAnomaliesRes, emailAnomaliesRes] = await Promise.all([
        networkAPI.getStatistics(),
        emailAPI.getStatistics(),
        networkAPI.getAll({ anomaly_only: 'true', limit: 5 }),
        emailAPI.getAll({ anomaly_only: 'true', limit: 5 })
      ]);

      setStats({
        network: networkRes.data || { total_traffic: 0, anomalies: 0 },
        email: emailRes.data || { total_emails: 0, anomalies: 0 },
        loading: false
      });

      // Combine and sort recent alerts
      const networkAlerts = (networkAnomaliesRes.data?.data || []).map(item => ({
        ...item,
        type: 'network'
      }));

      const emailAlerts = (emailAnomaliesRes.data?.data || []).map(item => ({
        ...item,
        type: 'email'
      }));

      const combined = [...networkAlerts, ...emailAlerts]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);

      setRecentAlerts(combined);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const totalRecords = (stats.network.total_traffic || 0) + (stats.email.total_emails || 0);
  const totalAnomalies = (stats.network.anomalies || 0) + (stats.email.anomalies || 0);
  const overallAnomalyRate = totalRecords > 0 
    ? ((totalAnomalies / totalRecords) * 100).toFixed(2) 
    : 0;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Real-time anomaly detection overview</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <Activity size={28} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Records</p>
            <p className="stat-value">{totalRecords}</p>
            <p className="stat-change positive">Active monitoring</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon anomaly">
            <AlertTriangle size={28} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Anomalies Detected</p>
            <p className="stat-value">{totalAnomalies}</p>
            <p className="stat-change">{overallAnomalyRate}% detection rate</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon network">
            <Network size={28} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Network Traffic</p>
            <p className="stat-value">{stats.network.total_traffic || 0}</p>
            <p className="stat-change">{stats.network.anomalies || 0} anomalies</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon email">
            <Mail size={28} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Email Communications</p>
            <p className="stat-value">{stats.email.total_emails || 0}</p>
            <p className="stat-change">{stats.email.anomalies || 0} anomalies</p>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Anomalies</h2>
          <a href="/alerts" className="view-all-link">View All →</a>
        </div>

        {recentAlerts.length === 0 ? (
          <div className="no-alerts">
            <Shield size={48} />
            <p>No anomalies detected</p>
            <p className="sub-text">Your system is secure</p>
          </div>
        ) : (
          <div className="alerts-list">
            {recentAlerts.map((alert, idx) => (
              <div key={idx} className="alert-item">
                <div className="alert-indicator anomaly"></div>
                <div className="alert-content">
                  <div className="alert-header">
                    <span className={`alert-badge ${alert.type}`}>
                      {alert.type.toUpperCase()}
                    </span>
                    {alert.threat_class && alert.threat_class !== 'none' && (
                      <span className="threat-badge">
                        {alert.threat_class.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="alert-details">
                    {alert.type === 'network' 
                      ? `${alert.source_ip} → ${alert.destination_ip}` 
                      : `${alert.sender_email} → ${alert.receiver_email}`}
                  </p>
                  <div className="alert-meta">
                    <span>Score: {(alert.anomaly_score * 100).toFixed(1)}%</span>
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Status */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>System Status</h2>
        </div>

        <div className="status-grid">
          <div className="status-card">
            <div className="status-indicator active"></div>
            <div>
              <p className="status-label">Network Monitor</p>
              <p className="status-value">Active</p>
            </div>
          </div>

          <div className="status-card">
            <div className="status-indicator active"></div>
            <div>
              <p className="status-label">Email Monitor</p>
              <p className="status-value">Active</p>
            </div>
          </div>

          <div className="status-card">
            <div className="status-indicator active"></div>
            <div>
              <p className="status-label">ML Models</p>
              <p className="status-value">Loaded</p>
            </div>
          </div>

          <div className="status-card">
            <div className="status-indicator active"></div>
            <div>
              <p className="status-label">Database</p>
              <p className="status-value">Connected</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
