import React, { useState, useEffect } from 'react';
import { emailAPI } from '../services/api';
import { toast } from 'react-toastify';
import './EmailCommunication.css';

const EmailCommunication = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    sender: '',
    recipient: '',
    subject: '',
    email_size: '',
    attachment_count: '',
    has_links: false,
    time_sent: '',
    num_recipients: ''
  });
  const [submitting, setSubmitting] = useState(false);

 useEffect(() => {
  if (emails.length > 0) {
    console.log('FIRST EMAIL OBJECT JSON:', JSON.stringify(emails[0], null, 2));
  }
}, [emails]);

// ADD THIS NEW useEffect:
useEffect(() => {
  fetchEmails();  // Initial fetch on mount
  const interval = setInterval(fetchEmails, 10000);  // Poll every 10 seconds
  return () => clearInterval(interval);  // Cleanup
}, []);  // Empty deps = runs once on mount, sets up polling



  const fetchEmails = async () => {
  try {
    setLoading(true);
    const response = await emailAPI.getAll();
    console.log('RAW EMAIL RESPONSE:', response);
    const list = response.data?.data || response.data || [];
    console.log('EMAIL LIST USED IN STATE:', list);
    setEmails(list);
  } catch (error) {
    console.error('Error fetching emails:', error);
    toast.error('❌ Failed to fetch emails', {
      position: 'top-right',
      autoClose: 3000,
    });
  } finally {
    setLoading(false);
  }
};


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const submitData = {
        ...formData,
        email_size: parseFloat(formData.email_size),
        attachment_count: parseInt(formData.attachment_count),
        num_recipients: parseInt(formData.num_recipients),
      };

      const response = await emailAPI.submit(submitData);

      const prediction = response.data?.prediction || response.prediction;
      const isAnomaly = prediction?.is_anomaly ?? prediction?.isanomaly;
      const threatClass = prediction?.threat_class || prediction?.threatclass || 'Unknown';

      if (isAnomaly) {
        toast.error(
          `⚠️ EMAIL ANOMALY DETECTED! Threat: ${threatClass.toUpperCase()}`,
          {
            position: 'top-right',
            autoClose: 5000,
          }
        );
      } else {
        toast.success('✅ Email analyzed - Normal', {
          position: 'top-right',
          autoClose: 3000,
        });
      }

      setFormData({
        sender: '',
        recipient: '',
        subject: '',
        email_size: '',
        attachment_count: '',
        has_links: false,
        time_sent: '',
        num_recipients: '',
      });

      fetchEmails();

      setTimeout(() => {
        setShowForm(false);
      }, 1000);
    } catch (error) {
      console.error('Error submitting email:', error);
      toast.error('❌ Failed to submit email data', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityClass = (score) => {
    if (score > 0.8) return 'critical';
    if (score > 0.6) return 'high';
    if (score > 0.4) return 'medium';
    return 'low';
  };

  const filteredEmails =
  filter === 'normal'
    ? emails.filter((e) => !(e.is_anomaly ?? e.isanomaly))
    : filter === 'anomaly'
    ? emails.filter((e) => e.is_anomaly ?? e.isanomaly)
    : emails;


  return (
    <div className="email-communication">
      <div className="page-header">
        <div>
          <h2>📧 Email Communication Analysis</h2>
          <p>Monitor and analyze email communications</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '❌ Cancel' : '➕ Add Email'}
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>Submit Email Data</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Sender Email *</label>
                <input
                  type="email"
                  name="sender"
                  value={formData.sender}
                  onChange={handleInputChange}
                  placeholder="sender@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Recipient Email *</label>
                <input
                  type="email"
                  name="recipient"
                  value={formData.recipient}
                  onChange={handleInputChange}
                  placeholder="recipient@example.com"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Email subject line"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Size (KB) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="email_size"
                  value={formData.email_size}
                  onChange={handleInputChange}
                  placeholder="125.5"
                  required
                />
              </div>

              <div className="form-group">
                <label>Attachment Count *</label>
                <input
                  type="number"
                  name="attachment_count"
                  value={formData.attachment_count}
                  onChange={handleInputChange}
                  placeholder="2"
                  required
                />
              </div>

              <div className="form-group">
                <label>Number of Recipients *</label>
                <input
                  type="number"
                  name="num_recipients"
                  value={formData.num_recipients}
                  onChange={handleInputChange}
                  placeholder="5"
                  required
                />
              </div>

              <div className="form-group">
                <label>Time Sent *</label>
                <input
                  type="datetime-local"
                  name="time_sent"
                  value={formData.time_sent}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="has_links"
                    checked={formData.has_links}
                    onChange={handleInputChange}
                  />
                  <span>Contains Links</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={submitting}
            >
              {submitting ? '⏳ Analyzing...' : '📧 Analyze Email'}
            </button>
          </form>
        </div>
      )}

      <div className="filter-bar">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All Emails
        </button>
        <button
          className={filter === 'anomaly' ? 'active' : ''}
          onClick={() => setFilter('anomaly')}
        >
          ⚠️ Anomalies Only
        </button>
        <button
          className={filter === 'normal' ? 'active' : ''}
          onClick={() => setFilter('normal')}
        >
          ✅ Normal Only
        </button>
        <button onClick={fetchEmails}>🔄 Refresh</button>
      </div>

      <div className="email-list">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading email data...</p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="no-data">
            <p>📭 No email data found</p>
            <p className="sub-text">
              Submit some email data to see results here
            </p>
          </div>
        ) : (
          filteredEmails.map((item) => {
            const isAnomaly = item.is_anomaly ?? item.isanomaly;
            const anomalyScore = item.anomaly_score ?? item.anomalyscore;
            const threatClass = item.threat_class ?? item.threatclass;
            const numRecipients = item.num_recipients ?? item.numrecipients;

            return (
              <div
                key={item._id || item.id}
                className={`email-item ${isAnomaly ? 'anomaly' : 'normal'}`}
              >
                <div className="email-header">
                  <div className="email-addresses">
                    <div className="sender">
                      <span className="label">From:</span>
                      <span className="email-badge">{item.sender}</span>
                    </div>
                    <span className="arrow">→</span>
                    <div className="recipient">
                      <span className="label">To:</span>
                      <span className="email-badge">{item.recipient}</span>
                    </div>
                  </div>
                  <div className="email-status">
                    {isAnomaly ? (
                      <span className="badge anomaly-badge">⚠️ Anomaly</span>
                    ) : (
                      <span className="badge normal-badge">✅ Normal</span>
                    )}
                  </div>
                </div>

                <div className="email-subject">
                  <strong>Subject:</strong> {item.subject}
                </div>

                <div className="email-details">
                  <div className="detail-item">
                    <span className="label">Size:</span>
                    <span className="value">{item.email_size} KB</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Attachments:</span>
                    <span className="value">{item.attachment_count}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Recipients:</span>
                    <span className="value">{numRecipients}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Links:</span>
                    <span className="value">
                      {item.has_links ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                </div>

                {isAnomaly && (
                  <div className="anomaly-info">
                    <div className="anomaly-score">
                      <span className="label">Anomaly Score:</span>
                      <span
                        className={`score ${getSeverityClass(anomalyScore)}`}
                      >
                        {(anomalyScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="threat-class">
                      <span className="label">Threat:</span>
                      <span className="value">{threatClass}</span>
                    </div>
                    <div className="confidence">
                      <span className="label">Confidence:</span>
                      <span className="value">
                        {(item.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}

                <div className="email-footer">
                  <span className="timestamp">
                    📅{' '}
                    {new Date(
                      item.time_sent || item.timestamp
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EmailCommunication;
