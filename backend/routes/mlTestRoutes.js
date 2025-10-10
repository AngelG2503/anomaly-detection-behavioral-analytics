const express = require('express');
const router = express.Router();
const mlTestController = require('../controllers/mlController');

// Test routes
router.get('/test/network', mlTestController.testNetworkPrediction);
router.get('/test/email', mlTestController.testEmailPrediction);
router.get('/health', mlTestController.checkMLHealth);

module.exports = router;
