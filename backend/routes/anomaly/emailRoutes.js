const express = require('express');
const router = express.Router();
const emailCommunicationController = require('../../controllers/anomaly/emailCommunicationController');
const authMiddleware = require('../../middleware/authMiddleware');

router.use(authMiddleware);
// Submit email for analysis
router.post('/submit', emailCommunicationController.submitEmailCommunication);

// Get all email communications
router.get('/', emailCommunicationController.getAllEmails);

// Get email statistics
router.get('/statistics', emailCommunicationController.getEmailStatistics);

// Get single email by ID
router.get('/:id', emailCommunicationController.getEmailById);

// Delete email by ID - ADD THIS LINE IF MISSING
router.delete('/:id', emailCommunicationController.deleteEmailById);

module.exports = router;
