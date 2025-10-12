const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set BOTH req.user AND req.userId for compatibility
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    req.userId = decoded.id; // ✅ ADD THIS - controllers use req.userId
    
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = authMiddleware; // ✅ CHANGE: Export directly, not as object
