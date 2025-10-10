const express = require('express');
const router = express.Router();
const emailCommunicationController = require('../../controllers/anomaly/emailCommunicationController');

// Submit email for analysis
router.post('/submit', emailCommunicationController.submitEmailCommunication);

// Get all email communications
router.get('/', emailCommunicationController.getAllEmails);

// Get email statistics
router.get('/statistics', emailCommunicationController.getEmailStatistics);

// Get single email by ID
router.get('/:id', emailCommunicationController.getEmailById);

module.exports = router;
