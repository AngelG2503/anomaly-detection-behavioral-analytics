import React, { useState, useEffect } from 'react';
import { networkAPI } from '../services/api';
import './NetworkTraffic.css';

const NetworkTraffic = () => {
    const [traffic, setTraffic] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState('all'); // all, anomaly, normal
    const [formData, setFormData] = useState({
        source_ip: '',
        destination_ip: '',
        protocol: 'tcp',
        packet_size: '',
        connection_duration: '',
        port_number: '',
        packets_sent: '',
        packets_received: '',
        bytes_sent: '',
        bytes_received: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchTraffic();
    }, [filter]);

    const fetchTraffic = async () => {
        try {
            setLoading(true);
            const params = filter === 'anomaly' ? { anomaly_only: 'true' } : {};
            const response = await networkAPI.getAll(params);
            setTraffic(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching traffic:', error);
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            // Convert string values to numbers
            const submitData = {
                ...formData,
                packet_size: parseFloat(formData.packet_size),
                connection_duration: parseFloat(formData.connection_duration),
                port_number: parseInt(formData.port_number),
                packets_sent: parseInt(formData.packets_sent),
                packets_received: parseInt(formData.packets_received),
                bytes_sent: parseInt(formData.bytes_sent),
                bytes_received: parseInt(formData.bytes_received)
            };

            const response = await networkAPI.submit(submitData);
            
            setMessage({ 
                type: 'success', 
                text: `Traffic analyzed! ${response.data.prediction.is_anomaly ? '⚠️ Anomaly Detected!' : '✅ Normal Traffic'}` 
            });
            
            // Reset form
            setFormData({
                source_ip: '',
                destination_ip: '',
                protocol: 'tcp',
                packet_size: '',
                connection_duration: '',
                port_number: '',
                packets_sent: '',
                packets_received: '',
                bytes_sent: '',
                bytes_received: ''
            });

            // Refresh traffic list
            fetchTraffic();
            
            // Close form after 2 seconds
            setTimeout(() => {
                setShowForm(false);
                setMessage({ type: '', text: '' });
            }, 2000);

        } catch (error) {
            console.error('Error submitting traffic:', error);
            setMessage({ 
                type: 'error', 
                text: 'Failed to submit traffic data' 
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

    const filteredTraffic = filter === 'normal' 
        ? traffic.filter(t => !t.is_anomaly)
        : traffic;

    return (
        <div className="network-traffic">
            <div className="page-header">
                <div>
                    <h2>🌐 Network Traffic Analysis</h2>
                    <p>Monitor and analyze network communications</p>
                </div>
                <button 
                    className="btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? '❌ Cancel' : '➕ Add Traffic'}
                </button>
            </div>

            {/* Submit Form */}
            {showForm && (
                <div className="form-container">
                    <h3>Submit Network Traffic Data</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Source IP *</label>
                                <input
                                    type="text"
                                    name="source_ip"
                                    value={formData.source_ip}
                                    onChange={handleInputChange}
                                    placeholder="192.168.1.100"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Destination IP *</label>
                                <input
                                    type="text"
                                    name="destination_ip"
                                    value={formData.destination_ip}
                                    onChange={handleInputChange}
                                    placeholder="8.8.8.8"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Protocol *</label>
                                <select
                                    name="protocol"
                                    value={formData.protocol}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="tcp">TCP</option>
                                    <option value="udp">UDP</option>
                                    <option value="http">HTTP</option>
                                    <option value="https">HTTPS</option>
                                    <option value="icmp">ICMP</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Port Number *</label>
                                <input
                                    type="number"
                                    name="port_number"
                                    value={formData.port_number}
                                    onChange={handleInputChange}
                                    placeholder="443"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Packet Size (bytes) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="packet_size"
                                    value={formData.packet_size}
                                    onChange={handleInputChange}
                                    placeholder="1500.5"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Connection Duration (sec) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="connection_duration"
                                    value={formData.connection_duration}
                                    onChange={handleInputChange}
                                    placeholder="120.5"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Packets Sent *</label>
                                <input
                                    type="number"
                                    name="packets_sent"
                                    value={formData.packets_sent}
                                    onChange={handleInputChange}
                                    placeholder="150"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Packets Received *</label>
                                <input
                                    type="number"
                                    name="packets_received"
                                    value={formData.packets_received}
                                    onChange={handleInputChange}
                                    placeholder="145"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Bytes Sent *</label>
                                <input
                                    type="number"
                                    name="bytes_sent"
                                    value={formData.bytes_sent}
                                    onChange={handleInputChange}
                                    placeholder="225000"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Bytes Received *</label>
                                <input
                                    type="number"
                                    name="bytes_received"
                                    value={formData.bytes_received}
                                    onChange={handleInputChange}
                                    placeholder="218000"
                                    required
                                />
                            </div>
                        </div>

                        {message.text && (
                            <div className={`message ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="btn-submit"
                            disabled={submitting}
                        >
                            {submitting ? '⏳ Analyzing...' : '🚀 Submit & Analyze'}
                        </button>
                    </form>
                </div>
            )}

            {/* Filter Buttons */}
            <div className="filter-bar">
                <button 
                    className={filter === 'all' ? 'active' : ''}
                    onClick={() => setFilter('all')}
                >
                    All Traffic
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
                <button onClick={fetchTraffic}>🔄 Refresh</button>
            </div>

            {/* Traffic List */}
            <div className="traffic-list">
                {loading ? (
                    <div className="loading">Loading traffic data...</div>
                ) : filteredTraffic.length === 0 ? (
                    <div className="no-data">No traffic data found</div>
                ) : (
                    filteredTraffic.map((item) => (
                        <div 
                            key={item._id} 
                            className={`traffic-item ${item.is_anomaly ? 'anomaly' : 'normal'}`}
                        >
                            <div className="traffic-header">
                                <div className="traffic-ips">
                                    <span className="ip-badge">{item.source_ip}</span>
                                    <span className="arrow">→</span>
                                    <span className="ip-badge">{item.destination_ip}</span>
                                </div>
                                <div className="traffic-status">
                                    {item.is_anomaly ? (
                                        <span className="badge anomaly-badge">⚠️ Anomaly</span>
                                    ) : (
                                        <span className="badge normal-badge">✅ Normal</span>
                                    )}
                                </div>
                            </div>

                            <div className="traffic-details">
                                <div className="detail-item">
                                    <span className="label">Protocol:</span>
                                    <span className="value">{item.protocol.toUpperCase()}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Port:</span>
                                    <span className="value">{item.port_number}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Duration:</span>
                                    <span className="value">{item.connection_duration}s</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Packets:</span>
                                    <span className="value">↑{item.packets_sent} ↓{item.packets_received}</span>
                                </div>
                            </div>

                            {item.is_anomaly && (
                                <div className="anomaly-info">
                                    <div className="anomaly-score">
                                        <span className="label">Anomaly Score:</span>
                                        <span className={`score ${getSeverityClass(item.anomaly_score)}`}>
                                            {(item.anomaly_score * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="threat-class">
                                        <span className="label">Threat:</span>
                                        <span className="value">{item.threat_class}</span>
                                    </div>
                                    <div className="confidence">
                                        <span className="label">Confidence:</span>
                                        <span className="value">{(item.confidence * 100).toFixed(1)}%</span>
                                    </div>
                                </div>
                            )}

                            <div className="traffic-footer">
                                <span className="timestamp">
                                    📅 {new Date(item.timestamp).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NetworkTraffic;
