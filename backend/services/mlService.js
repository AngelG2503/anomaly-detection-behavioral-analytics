const axios = require('axios');

// ML Backend URL from environment or default
const ML_BACKEND_URL = process.env.ML_BACKEND_URL || 'http://localhost:8000';

class MLService {
    /**
     * Predict network traffic anomaly
     * @param {Object} networkData - Network traffic data
     * @returns {Promise<Object>} Prediction result
     */
    async predictNetworkAnomaly(networkData) {
        try {
            const response = await axios.post(
                `${ML_BACKEND_URL}/predict/network`,  // ✅ Removed /api
                networkData,
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 5000
                }
            );
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error calling ML backend for network prediction:', error.message);
            console.error('Full error:', error.response?.data || error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Predict email anomaly
     * @param {Object} emailData - Email data
     * @returns {Promise<Object>} Prediction result
     */
    async predictEmailAnomaly(emailData) {
        try {
            const response = await axios.post(
                `${ML_BACKEND_URL}/predict/email`,  // ✅ Removed /api
                emailData,
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 5000
                }
            );
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error calling ML backend for email prediction:', error.message);
            console.error('Full error:', error.response?.data || error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check ML backend health
     * @returns {Promise<Object>} Health status
     */
    async checkHealth() {
        try {
            const response = await axios.get(`${ML_BACKEND_URL}/health`, {
                timeout: 3000
            });
            return {
                success: true,
                status: response.data.status
            };
        } catch (error) {
            console.error('ML backend health check failed:', error.message);
            return {
                success: false,
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Check if ML models are loaded
     * @returns {Promise<Object>} Models status
     */
    async checkModelsStatus() {
        try {
            const response = await axios.get(`${ML_BACKEND_URL}/models/status`, {  // ✅ Removed /api
                timeout: 3000
            });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Failed to get models status:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new MLService();
