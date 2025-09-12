const User = require('../models/User');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Generate JWT
// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role }, // 👈 include role
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Signup
// Signup
const signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, role, adminKey } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email already exists' });

    let finalRole = "user"; // default role

    if (role === "admin") {
      // ✅ Only allow admin role if adminKey matches .env
      if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ message: "Invalid admin key" });
      }
      finalRole = "admin";
    }

    const user = await User.create({ name, email, password, role: finalRole });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Login
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role:user.role,
        token: generateToken(user),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Save hashed token + expiry in DB
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  // In real app: send email with reset link
  const resetUrl = `http://localhost:3000/api/auth/reset-password/${resetToken}`;
  console.log('Password reset link:', resetUrl);

  res.json({ message: 'Password reset link sent', resetUrl });
};

// Reset password
// Reset password
const resetPassword = async (req, res) => {
  const resetToken = req.params.token;
  const { password } = req.body;

  // Hash token to compare with DB
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Find user with token and valid expiry
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

  // ✅ Set new password directly (hook will hash it)
  user.password = password;

  // Clear reset token fields
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.json({ message: 'Password has been reset successfully' });
};


module.exports = { 
    signup, 
    login,
    forgotPassword,
    resetPassword
 };
