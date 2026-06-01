/**
 * =============================================================================
 * AUTH ROUTES — /api/auth
 * =============================================================================
 * Ye file authentication ke liye hai:
 *   POST /api/auth/register  → Naya user banao (student/instructor only)
 *   POST /api/auth/login     → Login karo, JWT token milega
 *   GET  /api/auth/profile   → Apna profile dekho (token chahiye)
 *   PUT  /api/auth/profile   → Profile update karo
 *
 * Security:
 *   - Admin signup blocked (sirf seed.js se banta hai)
 *   - Instructor signup pe status = 'pending' hoga (admin approval chahiye)
 *   - Password bcrypt se hash hota hai (User model me pre-save hook)
 *   - JWT token 7 din ke liye valid hai
 * =============================================================================
 */

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator'); // Form validation
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

// ─── HELPER: JWT Token Generate karo ────────────────────────────────────────
// User ID se JWT banata hai — login aur register par use hota hai
const generateToken = (id) =>
  jwt.sign(
    { id },                          // Payload — user ki ID
    process.env.JWT_SECRET,          // Secret key — .env se aata hai
    { expiresIn: process.env.JWT_EXPIRE || '7d' } // 7 din valid
  );

// =============================================================================
// POST /api/auth/register
// Naya user banao — sirf student ya instructor
// Admin registration completely blocked hai
// =============================================================================
router.post(
  '/register',
  [
    // Input validation — galat data aane par error bhejo
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['student', 'instructor']).withMessage('Role must be student or instructor'),
  ],
  async (req, res) => {
    // Validation errors check karo
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { name, email, password, role } = req.body;

      // Admin registration block karo — security ke liye
      if (role === 'admin') {
        return res.status(403).json({ message: 'Admin registration is not allowed.' });
      }

      // Email already registered hai?
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) {
        return res.status(400).json({ message: 'This email is already registered. Please login.' });
      }

      // Instructor → pending status (admin approval chahiye)
      // Student   → directly approved (koi approval nahi chahiye)
      const status = role === 'instructor' ? 'pending' : 'approved';

      // User create karo — password User model me hash ho jaayega
      const user = await User.create({ name, email, password, role, status });

      // Instructor ke liye — no token, just message (login nahi kar sakta yet)
      if (role === 'instructor') {
        return res.status(201).json({
          success: true,
          pending: true, // Frontend isko check karega
          message: 'Registration submitted! Please wait for Admin approval before logging in.',
        });
      }

      // Student ke liye — seedha token do, login kara do
      const token = generateToken(user._id);
      res.status(201).json({
        success: true,
        message: 'Registration successful! Welcome to EduLearn.',
        token,
        user: {
          _id:    user._id,
          name:   user.name,
          email:  user.email,
          role:   user.role,
          avatar: user.avatar,
          status: user.status,
        },
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ message: 'Server error during registration. Please try again.' });
    }
  }
);

// =============================================================================
// POST /api/auth/login
// Email + password se login karo, JWT token milega
// Instructor pending check bhi yahan hota hai
// =============================================================================
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { email, password } = req.body;

      // User dhundo — email se (case-insensitive ke liye lowercase)
      const user = await User.findOne({ email: email.toLowerCase() });

      // User nahi mila — vague error dena (security: email existence reveal mat karo)
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      // Account deactivated? Admin ne band kiya hoga
      if (!user.isActive) {
        return res.status(401).json({ message: 'Your account has been deactivated. Please contact admin.' });
      }

      // Instructor specific checks
      if (user.role === 'instructor') {
        if (user.status === 'pending') {
          return res.status(403).json({
            message: 'Your instructor account is pending admin approval. Please wait for approval.',
          });
        }
        if (user.status === 'rejected') {
          return res.status(403).json({
            message: 'Your instructor account has been rejected. Please contact admin at rajni9496@gmail.com.',
          });
        }
      }

      // Password match karo — bcrypt compare
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      // Sab theek hai — token generate karo
      const token = generateToken(user._id);

      res.json({
        success: true,
        message: 'Login successful!',
        token,
        user: {
          _id:    user._id,
          name:   user.name,
          email:  user.email,
          role:   user.role,
          avatar: user.avatar,
          status: user.status,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error during login. Please try again.' });
    }
  }
);

// =============================================================================
// GET /api/auth/profile
// Logged-in user ka profile fetch karo
// Token required — protect middleware use karta hai
// =============================================================================
router.get('/profile', protect, async (req, res) => {
  try {
    // protect middleware se req.user aata hai (password exclude)
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// =============================================================================
// PUT /api/auth/profile
// User apna profile update kare (name, bio, avatar)
// Password change is NOT allowed here (separate endpoint honi chahiye)
// =============================================================================
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const updateData = {};
    if (name   !== undefined) updateData.name   = name;
    if (bio    !== undefined) updateData.bio    = bio;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, message: 'Profile updated!', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;
