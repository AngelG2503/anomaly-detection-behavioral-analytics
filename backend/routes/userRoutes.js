const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');

// Create User (with validation)
router.post(
  '/users',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
  ],
  userController.createUser
);

// Get All Users
router.get('/users', userController.getUsers);

// Update User (with validation)
router.put(
  '/users/:id',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please enter a valid email'),
  ],
  userController.updateUser
);

// Delete User
router.delete('/users/:id', userController.deleteUser);

module.exports = router;
