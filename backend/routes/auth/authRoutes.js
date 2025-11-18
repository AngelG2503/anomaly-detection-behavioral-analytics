const express = require('express');
const router = express.Router();
const { signup, login, forgotPassword, resetPassword } = require('../../controllers/auth/authController');
const passport = require('../../config/passport');
const jwt = require('jsonwebtoken');

// Direct function imports
router.post('/register', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// ✅ GOOGLE OAUTH ROUTES
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:3001/login' }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { id: req.user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.redirect(`http://localhost:3001/auth/google/success?token=${token}&refreshToken=${refreshToken}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}`);
  }
);

module.exports = router;
