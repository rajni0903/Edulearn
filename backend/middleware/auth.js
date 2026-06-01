/**
 * =============================================================================
 * AUTH MIDDLEWARE — middleware/auth.js
 * =============================================================================
 * Ye middleware JWT token verify karta hai har protected route par.
 *
 * protect: Token check karo — user logged in hai ya nahi
 * authorize: Role check karo — user ke paas permission hai ya nahi
 *
 * Usage:
 *   router.get('/admin', protect, authorize('admin'), handler)
 *   router.post('/courses', protect, authorize('instructor','admin'), handler)
 * =============================================================================
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// =============================================================================
// protect Middleware
// Authorization header se Bearer token nikalo aur verify karo
// =============================================================================
const protect = async (req, res, next) => {
  let token;

  // Authorization header check karo — format: "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // "Bearer " hata ke sirf token lo
      token = req.headers.authorization.split(' ')[1];

      // JWT verify karo — secret se match karo
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // User database se fetch karo — fresh data ke liye (password exclude)
      req.user = await User.findById(decoded.id).select('-password');

      // User exist karta hai?
      if (!req.user) {
        return res.status(401).json({ message: 'User not found. Token is invalid.' });
      }

      // Account active hai? Admin ne deactivate kiya hoga
      if (!req.user.isActive) {
        return res.status(401).json({ message: 'Your account has been deactivated. Contact admin.' });
      }

      // Sab theek — next middleware/handler call karo
      next();
    } catch (err) {
      // Token invalid ya expired
      console.error('JWT verify failed:', err.message);
      return res.status(401).json({
        message: err.name === 'TokenExpiredError'
          ? 'Session expired. Please login again.'
          : 'Not authorized. Invalid token.',
      });
    }
  } else {
    // Header me token hi nahi — unauthorized
    return res.status(401).json({ message: 'Not authorized. Please login first.' });
  }
};

// =============================================================================
// authorize Middleware Factory
// Specific roles ke liye access restrict karo
// Parameter me allowed roles pass karo
// =============================================================================
const authorize = (...roles) => {
  return (req, res, next) => {
    // req.user protect middleware ne set kiya hoga
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Your role '${req.user.role}' is not permitted. Required: ${roles.join(' or ')}.`,
      });
    }
    next(); // Role match — aage jao
  };
};

module.exports = { protect, authorize };
