/**
 * ADMIN ROUTES - /api/admin/*
 * Full CRUD for users, courses, quizzes, assignments
 * All routes protected with JWT + admin role check
 */
const express    = require('express');
const router     = express.Router();
const bcrypt     = require('bcryptjs');
const User       = require('../models/User');
const Course     = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const { Quiz, QuizResult } = require('../models/Quiz');
const { protect, authorize } = require('../middleware/auth');

// Helper: consistent JSON responses - no plain text errors ever
const ok  = (res, data)          => res.status(200).json({ success: true,  ...data });
const bad = (res, msg, code=400) => res.status(code).json({ success: false, message: msg });
const err = (res, msg, code=500) => res.status(code).json({ success: false, message: msg });

/* ─────────────────────────────────────────────────────────────
   STATS
───────────────────────────────────────────────────────────── */
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const [
      totalUsers, totalStudents, totalInstructors,
      pendingInstructors, rejectedInstructors,
      totalCourses, totalEnrollments, totalSubmissions,
      totalQuizzes, totalAssignments,
      recentUsers, recentCourses,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'instructor', status: 'approved' }),
      User.countDocuments({ role: 'instructor', status: 'pending' }),
      User.countDocuments({ role: 'instructor', status: 'rejected' }),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Submission.countDocuments(),
      Quiz.countDocuments(),
      Assignment.countDocuments(),
      User.find().select('-password').sort({ createdAt: -1 }).limit(5),
      Course.find().populate('instructorId', 'name email').sort({ createdAt: -1 }).limit(5),
    ]);
    return ok(res, {
      stats: {
        totalUsers, totalStudents, totalInstructors,
        pendingInstructors, rejectedInstructors,
        totalCourses, totalEnrollments, totalSubmissions,
        totalQuizzes, totalAssignments,
      },
      recentUsers, recentCourses,
    });
  } catch (e) {
    console.error('[admin/stats]', e);
    return err(res, 'Failed to load stats');
  }
});

/* ─────────────────────────────────────────────────────────────
   USER MANAGEMENT
───────────────────────────────────────────────────────────── */
// List users with search, filter, pagination
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 15 } = req.query;
    const query = {};
    if (role   && role   !== 'all') query.role   = role;
    if (status && status !== 'all') query.status = status;
    if (search) query.$or = [
      { name:  { $regex: search.trim(), $options: 'i' } },
      { email: { $regex: search.trim(), $options: 'i' } },
    ];
    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query).select('-password').sort({ createdAt: -1 })
        .skip((+page - 1) * +limit).limit(+limit),
    ]);
    return ok(res, { users, total, pages: Math.ceil(total / +limit), currentPage: +page });
  } catch (e) { return err(res, 'Failed to fetch users'); }
});

// Create user (admin bypass - always approved)
router.post('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      return bad(res, 'name, email, password, role are all required');
    if (password.length < 6)
      return bad(res, 'Password must be at least 6 characters');
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return bad(res, 'Email already registered', 409);
    const user = await User.create({
      name: name.trim(), email: email.toLowerCase().trim(),
      password, role, status: 'approved', isActive: true,
    });
    return ok(res, {
      message: `${role} account created!`,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, isActive: user.isActive, createdAt: user.createdAt },
    });
  } catch (e) {
    if (e.code === 11000) return bad(res, 'Email already in use', 409);
    return err(res, 'Failed to create user');
  }
});

// Update user
router.put('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, role, status, isActive, password } = req.body;
    if (req.params.id === req.user._id.toString() && role && role !== 'admin')
      return bad(res, 'Cannot change your own role');
    const updateData = {};
    if (name     !== undefined) updateData.name     = name.trim();
    if (email    !== undefined) updateData.email    = email.toLowerCase().trim();
    if (role     !== undefined) updateData.role     = role;
    if (status   !== undefined) updateData.status   = status;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 12);
    }
    const updated = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-password');
    if (!updated) return bad(res, 'User not found', 404);
    return ok(res, { message: 'User updated', user: updated });
  } catch (e) {
    if (e.code === 11000) return bad(res, 'Email already in use', 409);
    return err(res, 'Failed to update user');
  }
});

// Toggle active/inactive
router.put('/users/:id/toggle', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return bad(res, 'User not found', 404);
    if (user._id.toString() === req.user._id.toString())
      return bad(res, 'Cannot deactivate your own account');
    user.isActive = !user.isActive;
    await user.save();
    return ok(res, { message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user: { _id: user._id, isActive: user.isActive } });
  } catch (e) { return err(res, 'Toggle failed'); }
});

// Delete user
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return bad(res, 'Cannot delete your own account');
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return bad(res, 'User not found', 404);
    await Enrollment.deleteMany({ studentId: req.params.id });
    return ok(res, { message: `User "${user.name}" deleted` });
  } catch (e) { return err(res, 'Delete failed'); }
});

/* ─────────────────────────────────────────────────────────────
   INSTRUCTOR APPROVALS
───────────────────────────────────────────────────────────── */
router.get('/instructors/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor', status: 'pending' }).select('-password').sort({ createdAt: -1 });
    return ok(res, { instructors, count: instructors.length });
  } catch (e) { return err(res, 'Failed to load pending instructors'); }
});

router.put('/instructors/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const { action } = req.body;
    if (!['approve', 'reject'].includes(action)) return bad(res, 'action must be approve or reject');
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const user = await User.findByIdAndUpdate(req.params.id, { status: newStatus }, { new: true }).select('-password');
    if (!user) return bad(res, 'Instructor not found', 404);
    return ok(res, { message: `${user.name} ${newStatus}`, user });
  } catch (e) { return err(res, 'Approval action failed'); }
});

/* ─────────────────────────────────────────────────────────────
   COURSE MANAGEMENT
───────────────────────────────────────────────────────────── */
router.get('/courses', protect, authorize('admin'), async (req, res) => {
  try {
    const { search, page = 1, limit = 15 } = req.query;
    const query = {};
    if (search) query.title = { $regex: search.trim(), $options: 'i' };
    const [total, courses] = await Promise.all([
      Course.countDocuments(query),
      Course.find(query).populate('instructorId', 'name email').sort({ createdAt: -1 })
        .skip((+page - 1) * +limit).limit(+limit),
    ]);
    const coursesWithStats = await Promise.all(
      courses.map(async (c) => {
        const enrollCount = await Enrollment.countDocuments({ courseId: c._id });
        return { ...c.toObject(), enrolledStudents: enrollCount };
      })
    );
    return ok(res, { courses: coursesWithStats, total, pages: Math.ceil(total / +limit) });
  } catch (e) { return err(res, 'Failed to fetch courses'); }
});

router.delete('/courses/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return bad(res, 'Course not found', 404);
    await Enrollment.deleteMany({ courseId: req.params.id });
    return ok(res, { message: `Course "${course.title}" deleted` });
  } catch (e) { return err(res, 'Delete failed'); }
});

/* ─────────────────────────────────────────────────────────────
   QUIZ MANAGEMENT (Admin CRUD)
───────────────────────────────────────────────────────────── */
// Get all quizzes (admin view - includes correct answers)
router.get('/quizzes', protect, authorize('admin'), async (req, res) => {
  try {
    const { courseId, type, page = 1, limit = 20 } = req.query;
    const query = {};
    if (courseId) query.courseId = courseId;
    if (type)     query.type     = type;
    const [total, quizzes] = await Promise.all([
      Quiz.countDocuments(query),
      Quiz.find(query).populate('courseId', 'title').populate('createdBy', 'name')
        .sort({ createdAt: -1 }).skip((+page-1)*+limit).limit(+limit),
    ]);
    return ok(res, { quizzes, total, pages: Math.ceil(total / +limit) });
  } catch (e) { return err(res, 'Failed to fetch quizzes'); }
});

// Get single quiz (admin - full data)
router.get('/quizzes/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('courseId', 'title');
    if (!quiz) return bad(res, 'Quiz not found', 404);
    return ok(res, { quiz });
  } catch (e) { return err(res, 'Failed to fetch quiz'); }
});

// Update quiz (admin can edit title, duration, questions, etc.)
router.put('/quizzes/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, titleHindi, type, duration, passingScore, questions } = req.body;
    const updateData = {};
    if (title        !== undefined) updateData.title        = title;
    if (titleHindi   !== undefined) updateData.titleHindi   = titleHindi;
    if (type         !== undefined) updateData.type         = type;
    if (duration     !== undefined) updateData.duration     = duration;
    if (passingScore !== undefined) updateData.passingScore = passingScore;
    if (questions    !== undefined) updateData.questions    = questions;

    const quiz = await Quiz.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: false });
    if (!quiz) return bad(res, 'Quiz not found', 404);
    return ok(res, { message: 'Quiz updated successfully', quiz });
  } catch (e) {
    console.error('[admin/quizzes PUT]', e.message);
    return err(res, 'Failed to update quiz: ' + e.message);
  }
});

// Delete quiz + its results
router.delete('/quizzes/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return bad(res, 'Quiz not found', 404);
    await QuizResult.deleteMany({ quizId: req.params.id });
    return ok(res, { message: `Quiz "${quiz.title}" deleted` });
  } catch (e) { return err(res, 'Delete failed'); }
});

// Add question to quiz
router.post('/quizzes/:id/questions', protect, authorize('admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return bad(res, 'Quiz not found', 404);
    quiz.questions.push(req.body);
    await quiz.save();
    return ok(res, { message: 'Question added', quiz });
  } catch (e) { return err(res, 'Failed to add question: ' + e.message); }
});

// Remove question from quiz
router.delete('/quizzes/:id/questions/:qIndex', protect, authorize('admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return bad(res, 'Quiz not found', 404);
    const idx = parseInt(req.params.qIndex);
    if (idx < 0 || idx >= quiz.questions.length) return bad(res, 'Invalid question index');
    quiz.questions.splice(idx, 1);
    await quiz.save();
    return ok(res, { message: 'Question removed', quiz });
  } catch (e) { return err(res, 'Failed to remove question'); }
});

/* ─────────────────────────────────────────────────────────────
   ASSIGNMENT MANAGEMENT (Admin CRUD)
───────────────────────────────────────────────────────────── */
// Get all assignments
router.get('/assignments', protect, authorize('admin'), async (req, res) => {
  try {
    const { courseId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (courseId) query.courseId = courseId;
    const [total, assignments] = await Promise.all([
      Assignment.countDocuments(query),
      Assignment.find(query).populate('courseId', 'title').populate('createdBy', 'name')
        .sort({ createdAt: -1 }).skip((+page-1)*+limit).limit(+limit),
    ]);
    return ok(res, { assignments, total, pages: Math.ceil(total / +limit) });
  } catch (e) { return err(res, 'Failed to fetch assignments'); }
});

// Update assignment
router.put('/assignments/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, description, questions, dueDate, maxMarks } = req.body;
    const updateData = {};
    if (title       !== undefined) updateData.title       = title;
    if (description !== undefined) updateData.description = description;
    if (questions   !== undefined) updateData.questions   = questions;
    if (dueDate     !== undefined) updateData.dueDate     = dueDate;
    if (maxMarks    !== undefined) updateData.maxMarks    = maxMarks;
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!assignment) return bad(res, 'Assignment not found', 404);
    return ok(res, { message: 'Assignment updated', assignment });
  } catch (e) { return err(res, 'Failed to update assignment'); }
});

// Delete assignment + submissions
router.delete('/assignments/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) return bad(res, 'Assignment not found', 404);
    await Submission.deleteMany({ assignmentId: req.params.id });
    return ok(res, { message: `Assignment "${assignment.title}" deleted` });
  } catch (e) { return err(res, 'Delete failed'); }
});

/* ─────────────────────────────────────────────────────────────
   ENROLLMENTS
───────────────────────────────────────────────────────────── */
router.get('/enrollments', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [total, enrollments] = await Promise.all([
      Enrollment.countDocuments(),
      Enrollment.find().populate('studentId', 'name email').populate('courseId', 'title price')
        .sort({ createdAt: -1 }).skip((+page-1)*+limit).limit(+limit),
    ]);
    return ok(res, { enrollments, total, pages: Math.ceil(total / +limit) });
  } catch (e) { return err(res, 'Failed to fetch enrollments'); }
});

/* ─────────────────────────────────────────────────────────────
   QUIZ RESULTS (Admin analytics)
───────────────────────────────────────────────────────────── */
router.get('/quiz-results', protect, authorize('admin'), async (req, res) => {
  try {
    const results = await QuizResult.find()
      .populate('studentId', 'name email')
      .populate('quizId', 'title type')
      .sort({ createdAt: -1 }).limit(50);
    return ok(res, { results });
  } catch (e) { return err(res, 'Failed to fetch quiz results'); }
});

/* ─────────────────────────────────────────────────────────────
   CATEGORY MANAGEMENT (Admin CRUD)
   GET    /api/admin/categories        — List all categories
   POST   /api/admin/categories        — Create category
   PUT    /api/admin/categories/:id    — Update category
   DELETE /api/admin/categories/:id    — Delete category
   GET    /api/admin/categories/public — Public list (no auth)
───────────────────────────────────────────────────────────── */
const Category = require('../models/Category');

// Public route — for course create forms (no auth needed)
router.get('/categories/public', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    return ok(res, { categories });
  } catch (e) { return err(res, 'Failed to fetch categories'); }
});

// Admin: list all categories
router.get('/categories', protect, authorize('admin'), async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    return ok(res, { categories });
  } catch (e) { return err(res, 'Failed to fetch categories'); }
});

// Admin: create category
router.post('/categories', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    if (!name || !name.trim()) return bad(res, 'Category name is required');
    const exists = await Category.findOne({ name: name.trim() });
    if (exists) return bad(res, 'Category with this name already exists', 409);
    const category = await Category.create({
      name: name.trim(),
      description: description || '',
      color: color || '#0d6efd',
      icon: icon || 'bi-grid',
      createdBy: req.user._id,
    });
    return ok(res, { message: 'Category created!', category });
  } catch (e) { return err(res, 'Failed to create category: ' + e.message); }
});

// Admin: update category
router.put('/categories/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, description, color, icon, isActive } = req.body;
    const updateData = {};
    if (name        !== undefined) updateData.name        = name.trim();
    if (description !== undefined) updateData.description = description;
    if (color       !== undefined) updateData.color       = color;
    if (icon        !== undefined) updateData.icon        = icon;
    if (isActive    !== undefined) updateData.isActive    = isActive;
    const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!category) return bad(res, 'Category not found', 404);
    return ok(res, { message: 'Category updated!', category });
  } catch (e) { return err(res, 'Failed to update category'); }
});

// Admin: delete category
router.delete('/categories/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return bad(res, 'Category not found', 404);
    return ok(res, { message: 'Category deleted!' });
  } catch (e) { return err(res, 'Failed to delete category'); }
});

module.exports = router;
