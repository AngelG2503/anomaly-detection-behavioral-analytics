const User = require('../models/User');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// =======================
// Token generators
// =======================
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// =======================
// Signup
// =======================
const signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, role, adminKey } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email already exists' });

    let finalRole = "user"; // default role

    if (role === "admin") {
      if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ message: "Invalid admin key" });
      }
      finalRole = "admin";
    }

    const user = await User.create({ name, email, password, role: finalRole });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Login
// =======================
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Save refresh token in DB
      user.refreshToken = refreshToken;
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Forgot Password
// =======================
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Save hashed token + expiry in DB
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const resetUrl = `http://localhost:3000/api/auth/reset-password/${resetToken}`;
    console.log('Password reset link:', resetUrl);

    res.json({ message: 'Password reset link sent', resetUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Reset Password
// =======================
const resetPassword = async (req, res) => {
  const resetToken = req.params.token;
  const { password } = req.body;

  try {
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = password; // will be hashed by pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword
};
