const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../../controllers/auth/userController');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { authorizeRole } = require('../../middleware/authorizeRole');

// =====================
// PUBLIC ROUTES
// =====================

// Register User (Sign Up)
router.post(
  '/users',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  userController.createUser
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  userController.loginUser
);

// Refresh Token
router.post('/refresh-token', userController.refreshToken);

// Logout (protected)
router.post('/logout', authMiddleware, userController.logoutUser);

// Forgot Password
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Please enter a valid email')],
  userController.forgotPassword
);

// Reset Password
router.put(
  '/reset-password/:token',
  [body('password').notEmpty().withMessage('Password is required')],
  userController.resetPassword
);

// =====================
// PROTECTED ROUTES
// =====================

// Profile (accessible to any logged-in user)
router.get('/profile', authMiddleware, userController.getProfile);

// Update profile (current logged-in user)
router.put(
  '/profile',
  authMiddleware,
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please enter a valid email'),
    body('password').optional().notEmpty().withMessage('Password cannot be empty'),
  ],
  userController.updateProfile
);

// Get All Users (admin only)
router.get('/', authMiddleware, authorizeRole('admin'), userController.getUsers);

// Update any user (admin only)
router.put(
  '/:id',
  authMiddleware,
  authorizeRole('admin'),
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please enter a valid email'),
  ],
  userController.updateUser
);

// Delete User (admin only)
router.delete('/:id', authMiddleware, authorizeRole('admin'), userController.deleteUser);

module.exports = router;
