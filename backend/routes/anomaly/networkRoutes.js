const express = require('express');
const router = express.Router();
const networkTrafficController = require('../../controllers/anomaly/networkTrafficController');

// Submit network traffic for analysis
router.post('/submit', networkTrafficController.submitNetworkTraffic);

// Get all network traffic records
router.get('/', networkTrafficController.getAllNetworkTraffic);

// Get network traffic statistics
router.get('/statistics', networkTrafficController.getNetworkStatistics);

// Get single network traffic by ID
router.get('/:id', networkTrafficController.getNetworkTrafficById);

module.exports = router;
