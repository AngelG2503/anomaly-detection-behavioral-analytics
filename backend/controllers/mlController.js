const mlService = require('../services/mlService');

// Test network prediction
exports.testNetworkPrediction = async (req, res) => {
    try {
        const sampleData = {
            timestamp: new Date().toISOString(),
            source_ip: "192.168.1.100",
            destination_ip: "8.8.8.8",
            protocol: "tcp",
            packet_size: 1500.5,
            connection_duration: 120.5,
            port_number: 443,
            packets_sent: 150,
            packets_received: 145,
            bytes_sent: 225000.0,
            bytes_received: 218000.0
        };

        const result = await mlService.predictNetworkAnomaly(sampleData);
        
        if (result.success) {
            res.status(200).json({
                message: "Network prediction successful",
                prediction: result.data
            });
        } else {
            res.status(500).json({
                message: "ML prediction failed",
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            message: "Error testing network prediction",
            error: error.message
        });
    }
};

// Test email prediction
exports.testEmailPrediction = async (req, res) => {
    try {
        const sampleData = {
            timestamp: new Date().toISOString(),
            sender_email: "user@example.com",
            receiver_email: "admin@company.com",
            num_recipients: 1,
            email_size: 25000.0,
            has_attachment: true,
            num_attachments: 2,
            subject_length: 45,
            body_length: 500,
            is_reply: false,
            is_forward: false
        };

        const result = await mlService.predictEmailAnomaly(sampleData);
        
        if (result.success) {
            res.status(200).json({
                message: "Email prediction successful",
                prediction: result.data
            });
        } else {
            res.status(500).json({
                message: "ML prediction failed",
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            message: "Error testing email prediction",
            error: error.message
        });
    }
};

// Check ML backend health
exports.checkMLHealth = async (req, res) => {
    try {
        const health = await mlService.checkHealth();
        const modelsStatus = await mlService.checkModelsStatus();
        
        res.status(200).json({
            ml_backend_health: health,
            models_status: modelsStatus
        });
    } catch (error) {
        res.status(500).json({
            message: "Error checking ML backend",
            error: error.message
        });
    }
};
