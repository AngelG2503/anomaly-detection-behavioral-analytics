const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');

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

// Get All Users (you can later make this protected if you want)
router.get('/', userController.getUsers);

// =====================
// PROTECTED ROUTES
// =====================

// Update User
router.put(
  '/:id',
  authMiddleware, // ✅ protect this
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please enter a valid email'),
  ],
  userController.updateUser
);

// Delete User
router.delete('/:id', authMiddleware, userController.deleteUser);

// Profile (example protected route)
router.get('/profile', authMiddleware, (req, res) => {
  res.json({ message: 'Welcome to your profile!', user: req.user });
});

module.exports = router;
