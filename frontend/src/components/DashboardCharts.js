import React from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './DashboardCharts.css';

const DashboardCharts = ({ networkStats, emailStats, alertStats }) => {
  
  // Prepare data for Network vs Email comparison
  const comparisonData = [
    {
      name: 'Network',
      Total: networkStats?.total_traffic || 0,
      Anomalies: networkStats?.anomalies || 0,
      Normal: networkStats?.normal || 0
    },
    {
      name: 'Email',
      Total: emailStats?.total_emails || 0,
      Anomalies: emailStats?.anomalies || 0,
      Normal: emailStats?.normal || 0
    }
  ];

  // Prepare threat distribution data (combine network + email)
  const threatData = [];
  
  // Add network threats
  if (networkStats?.threat_distribution) {
    networkStats.threat_distribution.forEach(threat => {
      threatData.push({
        name: threat._id || 'Unknown',
        value: threat.count,
        type: 'network'
      });
    });
  }

  // Add email threats
  if (emailStats?.threat_distribution) {
    emailStats.threat_distribution.forEach(threat => {
      threatData.push({
        name: threat._id || 'Unknown',
        value: threat.count,
        type: 'email'
      });
    });
  }

  // Alert status distribution
  const alertStatusData = alertStats?.by_status ? [
    { name: 'New', value: alertStats.by_status.new, color: '#3b82f6' },
    { name: 'Acknowledged', value: alertStats.by_status.acknowledged, color: '#8b5cf6' },
    { name: 'Investigating', value: alertStats.by_status.investigating, color: '#f59e0b' },
    { name: 'Resolved', value: alertStats.by_status.resolved, color: '#10b981' }
  ].filter(item => item.value > 0) : [];

  // Severity distribution
  const severityData = alertStats?.severity_distribution ? 
    alertStats.severity_distribution.map(item => ({
      name: item._id,
      value: item.count
    })) : [];

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#f59e0b',
      low: '#10b981'
    };
    return colors[severity] || '#6b7280';
  };

  return (
    <div className="dashboard-charts">
      <h2 className="charts-title">📊 Analytics & Insights</h2>

      <div className="charts-grid">
        
        {/* Network vs Email Comparison */}
        <div className="chart-card">
          <h3>Network vs Email Traffic</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Total" fill="#3b82f6" />
              <Bar dataKey="Anomalies" fill="#ef4444" />
              <Bar dataKey="Normal" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Threat Distribution Pie Chart */}
        {threatData.length > 0 && (
          <div className="chart-card">
            <h3>Threat Type Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={threatData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {threatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Alert Status Distribution */}
        {alertStatusData.length > 0 && (
          <div className="chart-card">
            <h3>Alert Status Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={alertStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {alertStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Severity Distribution */}
        {severityData.length > 0 && (
          <div className="chart-card">
            <h3>Severity Levels</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSeverityColor(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    </div>
  );
};

export default DashboardCharts;
