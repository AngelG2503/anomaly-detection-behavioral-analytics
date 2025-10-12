const express = require('express');
const router = express.Router();
const networkTrafficController = require('../../controllers/anomaly/networkTrafficController');
const authMiddleware = require('../../middleware/authMiddleware'); // ✅ No braces


// ✅ ADD THIS LINE - Apply auth middleware to ALL routes below
router.use(authMiddleware);

// Submit network traffic for analysis
router.post('/submit', networkTrafficController.submitNetworkTraffic);

// Get all network traffic records
router.get('/', networkTrafficController.getAllNetworkTraffic);

// Get network statistics
router.get('/statistics', networkTrafficController.getNetworkStatistics);

// Get single record by ID
router.get('/:id', networkTrafficController.getNetworkTrafficById);

// Delete record by ID
router.delete('/:id', networkTrafficController.deleteNetworkTrafficById);

module.exports = router;
