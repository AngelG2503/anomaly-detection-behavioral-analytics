const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { signup, login, forgotPassword, resetPassword } = require('../../controllers/auth/authController');

// =====================
// AUTH ROUTES
// =====================

// Signup route
router.post(
  '/signup',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  signup
);

// Login route
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

// Forgot password (send reset token via email)
router.post('/forgot-password', forgotPassword);

// Reset password using token
router.post('/reset-password/:token', resetPassword);

module.exports = router;
