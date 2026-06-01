/**
 * ENROLLMENT ROUTES - /api/enrollments
 * Handles course enrollment + video progress tracking
 */
const express    = require('express');
const router     = express.Router();
const Enrollment = require('../models/Enrollment');
const Course     = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');

// Enroll in a course
router.post('/', protect, async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    const existing = await Enrollment.findOne({ studentId: req.user._id, courseId });
    if (existing) return res.status(400).json({ success: false, message: 'Already enrolled' });
    const enrollment = await Enrollment.create({ studentId: req.user._id, courseId });
    await Course.findByIdAndUpdate(courseId, { $inc: { totalStudents: 1 } });
    res.status(201).json({ success: true, message: 'Enrolled successfully!', enrollment });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ success: false, message: 'Already enrolled' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Student's enrolled courses with full course + video data
router.get('/my-courses', protect, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ studentId: req.user._id })
      .populate({ path: 'courseId', populate: { path: 'instructorId', select: 'name avatar' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, enrollments });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Check enrollment
router.get('/check/:courseId', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({ studentId: req.user._id, courseId: req.params.courseId });
    res.json({ success: true, isEnrolled: !!enrollment, enrollment });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Update overall progress
router.put('/:id/progress', protect, async (req, res) => {
  try {
    const { progress } = req.body;
    const update = { progress };
    if (progress >= 100) update.completedAt = new Date();
    const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, enrollment });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

/**
 * MARK VIDEO AS COMPLETED
 * PUT /api/enrollments/:id/video-progress
 * Body: { videoId: string }
 * Auto-recalculates overall course progress %
 */
router.put('/:id/video-progress', protect, async (req, res) => {
  try {
    const { videoId } = req.body;
    if (!videoId) return res.status(400).json({ success: false, message: 'videoId required' });

    const enrollment = await Enrollment.findById(req.params.id).populate('courseId', 'videos');
    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });

    // Check ownership
    if (enrollment.studentId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Unauthorized' });

    // Mark video completed (upsert into videoProgress array)
    const alreadyDone = enrollment.videoProgress.find(v => v.videoId === videoId);
    if (!alreadyDone) {
      enrollment.videoProgress.push({ videoId, completed: true, completedAt: new Date() });
    }

    // Recalculate overall progress based on videos completed vs total videos
    const totalVideos = enrollment.courseId?.videos?.length || 1;
    const completedCount = enrollment.videoProgress.filter(v => v.completed).length;
    enrollment.progress = Math.round((completedCount / totalVideos) * 100);
    if (enrollment.progress >= 100) enrollment.completedAt = new Date();

    await enrollment.save();
    res.json({ success: true, message: 'Video marked complete', enrollment });
  } catch (e) {
    console.error('Video progress error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: all enrollments
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate('studentId', 'name email').populate('courseId', 'title')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: enrollments.length, enrollments });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
