import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, Activity } from 'lucide-react';
import axios from 'axios';
import './Statistics.css';

const Statistics = () => {
  const [stats, setStats] = useState({
    network: null,
    email: null,
    loading: true
  });

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const [networkRes, emailRes] = await Promise.all([
        axios.get('http://localhost:3000/api/network/statistics'),
        axios.get('http://localhost:3000/api/email/statistics')
      ]);

      setStats({
        network: networkRes.data,
        email: emailRes.data,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  if (stats.loading) {
    return (
      <div className="stats-loading">
        <div className="spinner"></div>
        <p>Loading statistics...</p>
      </div>
    );
  }

  const networkData = stats.network || {};
  const emailData = stats.email || {};

  return (
    <div className="statistics-container">
      <div className="stats-header">
        <h1>Analytics & Statistics</h1>
        <p>Comprehensive overview of anomaly detection performance</p>
      </div>

      {/* Overview Cards */}
      <div className="overview-grid">
        <div className="stat-card-large">
          <div className="stat-icon network">
            <Activity size={32} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Network Traffic</p>
            <p className="stat-value">{networkData.total_traffic || 0}</p>
            <p className="stat-subtext">
              {networkData.anomalies || 0} anomalies ({networkData.anomaly_percentage || 0}%)
            </p>
          </div>
        </div>

        <div className="stat-card-large">
          <div className="stat-icon email">
            <Activity size={32} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Email Communications</p>
            <p className="stat-value">{emailData.total_emails || 0}</p>
            <p className="stat-subtext">
              {emailData.anomalies || 0} anomalies ({emailData.anomaly_percentage || 0}%)
            </p>
          </div>
        </div>

        <div className="stat-card-large">
          <div className="stat-icon total">
            <TrendingUp size={32} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Anomalies</p>
            <p className="stat-value">
              {(networkData.anomalies || 0) + (emailData.anomalies || 0)}
            </p>
            <p className="stat-subtext">Last 24h: {(networkData.recent_anomalies_24h || 0) + (emailData.recent_anomalies_24h || 0)}</p>
          </div>
        </div>
      </div>

      {/* Network Statistics */}
      <div className="section-header">
        <BarChart3 size={24} />
        <h2>Network Traffic Analysis</h2>
      </div>

      <div className="stats-grid">
        <div className="stats-card">
          <h3>Distribution</h3>
          <div className="distribution-bars">
            <div className="dist-item">
              <span className="dist-label">Normal Traffic</span>
              <div className="dist-bar">
                <div 
                  className="dist-fill normal"
                  style={{ width: `${networkData.total_traffic > 0 ? (networkData.normal / networkData.total_traffic * 100) : 0}%` }}
                ></div>
              </div>
              <span className="dist-value">{networkData.normal || 0}</span>
            </div>
            <div className="dist-item">
              <span className="dist-label">Anomalies</span>
              <div className="dist-bar">
                <div 
                  className="dist-fill anomaly"
                  style={{ width: `${networkData.total_traffic > 0 ? (networkData.anomalies / networkData.total_traffic * 100) : 0}%` }}
                ></div>
              </div>
              <span className="dist-value">{networkData.anomalies || 0}</span>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <h3>Threat Types</h3>
          <div className="threat-list">
            {networkData.threat_distribution && networkData.threat_distribution.length > 0 ? (
              networkData.threat_distribution.map((threat, idx) => (
                <div key={idx} className="threat-item">
                  <span className="threat-name">{threat._id || 'Unknown'}</span>
                  <span className="threat-count">{threat.count}</span>
                </div>
              ))
            ) : (
              <p className="no-data">No threat data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Email Statistics */}
      <div className="section-header">
        <PieChart size={24} />
        <h2>Email Communication Analysis</h2>
      </div>

      <div className="stats-grid">
        <div className="stats-card">
          <h3>Distribution</h3>
          <div className="distribution-bars">
            <div className="dist-item">
              <span className="dist-label">Normal Emails</span>
              <div className="dist-bar">
                <div 
                  className="dist-fill normal"
                  style={{ width: `${emailData.total_emails > 0 ? (emailData.normal / emailData.total_emails * 100) : 0}%` }}
                ></div>
              </div>
              <span className="dist-value">{emailData.normal || 0}</span>
            </div>
            <div className="dist-item">
              <span className="dist-label">Anomalies</span>
              <div className="dist-bar">
                <div 
                  className="dist-fill anomaly"
                  style={{ width: `${emailData.total_emails > 0 ? (emailData.anomalies / emailData.total_emails * 100) : 0}%` }}
                ></div>
              </div>
              <span className="dist-value">{emailData.anomalies || 0}</span>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <h3>Threat Types</h3>
          <div className="threat-list">
            {emailData.threat_distribution && emailData.threat_distribution.length > 0 ? (
              emailData.threat_distribution.map((threat, idx) => (
                <div key={idx} className="threat-item">
                  <span className="threat-name">{threat._id || 'Unknown'}</span>
                  <span className="threat-count">{threat.count}</span>
                </div>
              ))
            ) : (
              <p className="no-data">No threat data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div className="section-header">
        <BarChart3 size={24} />
        <h2>Network vs Email Comparison</h2>
      </div>

      <div className="comparison-card">
        <div className="comparison-item">
          <p className="comparison-label">Total Records</p>
          <div className="comparison-bars">
            <div className="comparison-bar-item">
              <span>Network</span>
              <div className="comparison-bar">
                <div 
                  className="comparison-fill network"
                  style={{ width: `${Math.max((networkData.total_traffic || 0) / Math.max(networkData.total_traffic || 1, emailData.total_emails || 1) * 100, 5)}%` }}
                ></div>
              </div>
              <span>{networkData.total_traffic || 0}</span>
            </div>
            <div className="comparison-bar-item">
              <span>Email</span>
              <div className="comparison-bar">
                <div 
                  className="comparison-fill email"
                  style={{ width: `${Math.max((emailData.total_emails || 0) / Math.max(networkData.total_traffic || 1, emailData.total_emails || 1) * 100, 5)}%` }}
                ></div>
              </div>
              <span>{emailData.total_emails || 0}</span>
            </div>
          </div>
        </div>

        <div className="comparison-item">
          <p className="comparison-label">Anomaly Rate</p>
          <div className="comparison-bars">
            <div className="comparison-bar-item">
              <span>Network</span>
              <div className="comparison-bar">
                <div 
                  className="comparison-fill anomaly"
                  style={{ width: `${networkData.anomaly_percentage || 0}%` }}
                ></div>
              </div>
              <span>{networkData.anomaly_percentage || 0}%</span>
            </div>
            <div className="comparison-bar-item">
              <span>Email</span>
              <div className="comparison-bar">
                <div 
                  className="comparison-fill anomaly"
                  style={{ width: `${emailData.anomaly_percentage || 0}%` }}
                ></div>
              </div>
              <span>{emailData.anomaly_percentage || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
