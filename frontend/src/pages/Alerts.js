import React, { useState, useEffect } from 'react';
import { AlertTriangle, Filter, Eye, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';
import './Alerts.css';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    fetchAlerts();
    fetchStatistics();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [alerts, filterType, filterSeverity, filterStatus]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
  `${process.env.REACT_APP_API_BASE_URL}/api/alerts`,
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);

      setAlerts(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
  `${process.env.REACT_APP_API_BASE_URL}/api/alerts/statistics`,
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);

      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...alerts];

    if (filterType !== 'all') {
      filtered = filtered.filter(alert => alert.alert_type === filterType);
    }

    if (filterSeverity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === filterSeverity);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(alert => alert.status === filterStatus);
    }

    setFilteredAlerts(filtered);
  };

  const updateAlertStatus = async (alertId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
     await axios.put(
  `${process.env.REACT_APP_API_BASE_URL}/api/alerts/${alertId}/status`,
  { status: newStatus },
  { headers: { Authorization: `Bearer ${token}` } }
);

fetchAlerts();
fetchStatistics();

    } catch (error) {
      console.error('Error updating alert status:', error);
      alert('Failed to update alert status');
    }
  };

  const deleteAlert = async (id) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
  `${process.env.REACT_APP_API_BASE_URL}/api/alerts/${id}`,
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);

      fetchAlerts();
      fetchStatistics();
    } catch (error) {
      console.error('Error deleting alert:', error);
      alert('Failed to delete alert');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#f97316',
      critical: '#ef4444'
    };
    return colors[severity] || '#6b7280';
  };

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <h1>🚨 Security Alerts</h1>
        <p>View and manage detected anomalies</p>
        <button className="btn-refresh" onClick={() => { fetchAlerts(); fetchStatistics(); }}>
          🔄 Refresh
        </button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <p className="stat-label">Total Alerts</p>
              <p className="stat-value">{statistics.total_alerts}</p>
            </div>
            <AlertTriangle className="stat-icon" size={32} />
          </div>

          <div className="stat-card stat-new">
            <div className="stat-content">
              <p className="stat-label">New Alerts</p>
              <p className="stat-value">{statistics.by_status.new}</p>
            </div>
            <AlertCircle className="stat-icon" size={32} />
          </div>

          <div className="stat-card stat-investigating">
            <div className="stat-content">
              <p className="stat-label">Investigating</p>
              <p className="stat-value">{statistics.by_status.investigating}</p>
            </div>
            <Clock className="stat-icon" size={32} />
          </div>

          <div className="stat-card stat-resolved">
            <div className="stat-content">
              <p className="stat-label">Resolved</p>
              <p className="stat-value">{statistics.by_status.resolved}</p>
            </div>
            <CheckCircle className="stat-icon" size={32} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-section">
        <Filter size={20} />
        <span className="filter-label">Filters:</span>
        
        <div className="filter-group">
          <label>Type:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All</option>
            <option value="network">Network</option>
            <option value="email">Email</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Severity:</label>
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <span className="filter-results">
          Showing {filteredAlerts.length} of {alerts.length}
        </span>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading alerts...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="no-alerts">
          <AlertTriangle size={48} />
          <p>No alerts found</p>
          <p className="sub-text">Adjust filters or submit data to generate alerts</p>
        </div>
      ) : (
        <div className="alerts-list">
          {filteredAlerts.map((alert) => (
            <div key={alert._id} className={`alert-card severity-${alert.severity}`}>
              <div className="alert-content">
                <div className="alert-badges">
                  <span 
                    className={`badge severity-badge`}
                    style={{ backgroundColor: getSeverityColor(alert.severity) }}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className={`badge type-${alert.alert_type}`}>
                    {alert.alert_type.toUpperCase()}
                  </span>
                  <span className={`badge status-${alert.status}`}>
                    {alert.status.toUpperCase().replace('_', ' ')}
                  </span>
                  {alert.threat_class && (
                    <span className="badge threat">
                      {alert.threat_class.toUpperCase().replace('_', ' ')}
                    </span>
                  )}
                </div>
                
                <div className="alert-details">
                  <div className="detail-row">
                    <strong>Detected:</strong> {new Date(alert.detected_at).toLocaleString()}
                  </div>
                  
                  <div className="detail-row">
                    <strong>Anomaly Score:</strong> {(alert.anomaly_score * 100).toFixed(2)}%
                  </div>

                  <div className="detail-row">
                    <strong>Confidence:</strong> {(alert.confidence * 100).toFixed(2)}%
                  </div>

                  <div className="detail-row">
                    <strong>Details:</strong> {alert.details}
                  </div>
                </div>

                {/* Status Actions */}
                <div className="status-actions">
                  {alert.status === 'new' && (
                    <>
                      <button 
                        onClick={() => updateAlertStatus(alert._id, 'acknowledged')}
                        className="btn-status btn-acknowledge"
                      >
                        ✓ Acknowledge
                      </button>
                      <button 
                        onClick={() => updateAlertStatus(alert._id, 'investigating')}
                        className="btn-status btn-investigate"
                      >
                        🔍 Investigate
                      </button>
                    </>
                  )}
                  
                  {alert.status === 'acknowledged' && (
                    <button 
                      onClick={() => updateAlertStatus(alert._id, 'investigating')}
                      className="btn-status btn-investigate"
                    >
                      🔍 Start Investigation
                    </button>
                  )}
                  
                  {alert.status === 'investigating' && (
                    <>
                      <button 
                        onClick={() => updateAlertStatus(alert._id, 'resolved')}
                        className="btn-status btn-resolve"
                      >
                        ✓ Resolve
                      </button>
                      <button 
                        onClick={() => updateAlertStatus(alert._id, 'false_positive')}
                        className="btn-status btn-false-positive"
                      >
                        ✗ False Positive
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="alert-actions">
                <button
                  onClick={() => setSelectedAlert(alert)}
                  className="btn-view"
                  title="View Details"
                >
                  <Eye size={20} />
                </button>
                <button
                  onClick={() => deleteAlert(alert._id)}
                  className="btn-delete"
                  title="Delete Alert"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedAlert && (
        <div className="modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Alert Details</h2>
              <button onClick={() => setSelectedAlert(null)} className="modal-close">×</button>
            </div>

            <div className="modal-body">
              <div className="alert-badges">
                <span 
                  className="badge severity-badge"
                  style={{ backgroundColor: getSeverityColor(selectedAlert.severity) }}
                >
                  {selectedAlert.severity.toUpperCase()}
                </span>
                <span className="badge type">{selectedAlert.alert_type.toUpperCase()}</span>
                <span className="badge status">{selectedAlert.status.toUpperCase().replace('_', ' ')}</span>
              </div>

              <div className="info-box">
                <p className="info-label">Alert ID</p>
                <p className="info-value">{selectedAlert._id}</p>
              </div>

              <div className="info-box">
                <p className="info-label">Threat Class</p>
                <p className="info-value">{selectedAlert.threat_class?.toUpperCase().replace('_', ' ') || 'N/A'}</p>
              </div>

              <div className="info-box">
                <p className="info-label">Detected At</p>
                <p className="info-value">{new Date(selectedAlert.detected_at).toLocaleString()}</p>
              </div>

              <div className="info-box">
                <p className="info-label">Anomaly Score</p>
                <p className="info-value">{(selectedAlert.anomaly_score * 100).toFixed(2)}%</p>
              </div>

              <div className="info-box">
                <p className="info-label">Confidence</p>
                <p className="info-value">{(selectedAlert.confidence * 100).toFixed(2)}%</p>
              </div>

              <div className="info-box">
                <p className="info-label">Priority</p>
                <p className="info-value">{selectedAlert.priority} / 5</p>
              </div>

              <div className="info-box">
                <p className="info-label">Details</p>
                <p className="info-value">{selectedAlert.details}</p>
              </div>

              <div className="info-box">
                <p className="info-label">Full Data</p>
                <pre className="json-display">{JSON.stringify(selectedAlert, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
