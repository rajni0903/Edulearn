/**
 * =============================================================================
 * SERVER.JS — EduLearn Backend Entry Point
 * =============================================================================
 * Ye main Express server file hai.
 * Yahan:
 *   1. Middleware setup (CORS, JSON parsing)
 *   2. API routes register
 *   3. Certificate PDF endpoint
 *   4. Error handling
 *   5. Server start
 *
 * Port: 5000 (default) — .env se change kar sakte ho
 * MongoDB: connectDB() se connect hota hai app start par
 * =============================================================================
 */

const express   = require('express');
const cors      = require('cors');      // Cross-Origin requests allow karne ke liye
const dotenv    = require('dotenv');    // .env file variables load karne ke liye
const connectDB = require('./config/db');

// .env load karo — sabse pehle (baaki code .env variables use karta hai)
dotenv.config();

// MongoDB connect karo
connectDB();

// Express app create karo
const app = express();

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================

// CORS — All origins allow karo (dev + prod dono ke liye)
// Frontend proxy use karta hai dev me, production me same-origin hoga
app.use(cors({
  origin: true,          // Reflect request origin — credentials ke saath compatible
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
// Pre-flight requests handle karo
app.options('*', cors());

// JSON body parser — request body ko JSON parse karo
app.use(express.json({ limit: '10mb' })); // 10MB limit — large data ke liye

// URL-encoded form data parse karo
app.use(express.urlencoded({ extended: true }));

// =============================================================================
// API ROUTES
// Har route file ek specific feature handle karti hai
// =============================================================================
app.use('/api/auth',        require('./routes/auth'));        // Login, register, profile
app.use('/api/courses',     require('./routes/courses'));     // Course CRUD + videos
app.use('/api/enrollments', require('./routes/enrollments')); // Student enrollments
app.use('/api/quizzes',     require('./routes/quizzes'));     // Practice + exam quizzes
app.use('/api/assignments', require('./routes/assignments')); // Assignments + submissions
app.use('/api/admin',       require('./routes/admin'));       // Admin management


// =============================================================================
// CERTIFICATE PDF ENDPOINT
// GET /api/certificate/:enrollmentId?token=JWT
// Supports both Authorization header and ?token= query param for direct downloads
// =============================================================================
const jwt_cert = require('jsonwebtoken');
const User     = require('./models/User');

// Flexible auth: header Bearer OR ?token= query param
const certAuth = async (req, res, next) => {
  let token = null;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }
  if (!token) return res.status(401).json({ message: 'Not authorized. Please login first.' });
  try {
    const decoded = jwt_cert.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found.' });
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token. Please login again.' });
  }
};
const { protect }         = require('./middleware/auth');
const Enrollment          = require('./models/Enrollment');
const Course              = require('./models/Course');
const generateCertificate = require('./utils/certificate');

app.get('/api/certificate/:enrollmentId', certAuth, async (req, res) => {
  try {
    // Enrollment fetch karo — student aur course details ke saath
    const enrollment = await Enrollment.findById(req.params.enrollmentId)
      .populate('courseId')
      .populate('studentId', 'name');

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Certificate issued hai? (Exam pass hona chahiye)
    if (!enrollment.certificateIssued) {
      return res.status(400).json({
        message: 'Certificate not earned yet. Pass the final exam with 75%+ to earn your certificate.',
      });
    }

    // Sirf enrolled student ya admin access kar sake
    if (req.user.role !== 'admin' && enrollment.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Course aur instructor details fetch karo
    const course = await Course.findById(enrollment.courseId._id || enrollment.courseId)
      .populate('instructorId', 'name');

    // PDF generate karo — with performance percentage from quiz result
    const { QuizResult } = require('./models/Quiz');
    const lastExam = await QuizResult.findOne({
      studentId: enrollment.studentId._id,
      courseId:  enrollment.courseId._id || enrollment.courseId,
    }).sort({ createdAt: -1 });
    const percentage = lastExam?.percentage || 100;

    const pdfBuffer = await generateCertificate(
      enrollment.studentId.name,
      course.title,
      course.instructorId?.name || 'EduLearn Instructor',
      enrollment.completedAt || new Date(),
      percentage
    );

    // PDF response bhejo — download prompt ke saath
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="EduLearn-Certificate-${course.title.replace(/\s+/g,'-')}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Certificate generation error:', err);
    res.status(500).json({ message: 'Error generating certificate. Please try again.' });
  }
});

// =============================================================================
// HEALTH CHECK
// GET / — API running hai ya nahi confirm karo
// =============================================================================
app.get('/', (req, res) => {
  res.json({
    message:   '✅ EduLearn API is running!',
    version:   '2.0.0',
    status:    'healthy',
    timestamp: new Date().toISOString(),
    docs:      'See README.md for API documentation',
  });
});

// =============================================================================
// 404 HANDLER — Koi route match nahi hua
// =============================================================================
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.url} not found`,
    hint:    'Check the API documentation in README.md',
  });
});

// =============================================================================
// GLOBAL ERROR HANDLER — Unhandled errors yahan aate hain
// =============================================================================
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// =============================================================================
// START SERVER
// =============================================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  🚀 EduLearn Server → http://localhost:${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
