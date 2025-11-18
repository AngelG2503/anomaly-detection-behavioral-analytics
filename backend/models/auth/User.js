const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // ✅ CHANGED: Not required for OAuth users
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  refreshToken: String,
  googleId: { type: String, unique: true, sparse: true },
}, { timestamps: true });

// Hash password before saving (ONLY if password exists)
userSchema.pre('save', async function (next) {
  // ✅ ADDED: Skip if no password or not modified
  if (!this.password || !this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  // ✅ ADDED: Return false if no password set (OAuth user)
  if (!this.password) return false;
  
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash reset password token
userSchema.methods.getResetPasswordToken = function () {
  // Generate raw token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash it and save in DB
  this.resetPasswordToken = crypto.createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken; // return raw token (not hashed) so we can send it to user
};

// ✅ FIX: Prevent duplicate model error
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
