const express = require('express');
const router = express.Router();
const alertController = require('../../controllers/anomaly/alertController');

// Get all alerts
router.get('/', alertController.getAllAlerts);

// Get alert statistics
router.get('/statistics', alertController.getAlertStatistics);

// Get single alert by ID
router.get('/:id', alertController.getAlertById);

// Update alert status
router.put('/:id/status', alertController.updateAlertStatus);

// Add note to alert
router.post('/:id/notes', alertController.addNoteToAlert);

// Add action to alert
router.post('/:id/actions', alertController.addActionToAlert);

// Delete alert (admin only)
router.delete('/:id', alertController.deleteAlert);

module.exports = router;
