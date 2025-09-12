const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/authorizeRole');

// =====================
// PUBLIC ROUTES
// =====================

// Register User (Sign Up)
router.post(
  '/users',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
  ],
  userController.createUser
);

// =====================
// PROTECTED ROUTES
// =====================

// Profile (accessible to any logged-in user)
router.get('/profile', authMiddleware, (req, res) => {
  res.json({ message: 'Welcome to your profile!', user: req.user });
});

// Update profile (current logged-in user)
router.put(
  '/profile',
  authMiddleware,
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please enter a valid email'),
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
