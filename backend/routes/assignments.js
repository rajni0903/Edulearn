/**
 * ASSIGNMENT ROUTES - /api/assignments
 * NOTE: Specific routes MUST come before /:id wildcard
 */
const express    = require('express');
const router     = express.Router();
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course     = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');

// ── GET assignments for a course (specific routes FIRST)
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const assignments = await Assignment.find({ courseId: req.params.courseId }).sort({ dueDate: 1 });
    res.json({ success: true, assignments });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ── GET my submissions (student)
router.get('/my-submissions', protect, async (req, res) => {
  try {
    const submissions = await Submission.find({ studentId: req.user._id })
      .populate('assignmentId', 'title dueDate maxMarks')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });
    res.json({ success: true, submissions });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ── GET instructor received submissions
router.get('/instructor/received', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const submissions = await Submission.find({ instructorId: req.user._id })
      .populate('studentId', 'name email avatar')
      .populate('assignmentId', 'title dueDate maxMarks')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });
    const unseenCount = submissions.filter(s => !s.seenByInstructor).length;
    res.json({ success: true, submissions, unseenCount });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ── POST submit assignment (student)
router.post('/submit', protect, async (req, res) => {
  try {
    const { assignmentId, submissionLink, content = '' } = req.body;
    if (!submissionLink) return res.status(400).json({ success: false, message: 'Submission link required' });
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    const course       = await Course.findById(assignment.courseId);
    const instructorId = course?.instructorId || null;

    // Upsert: already submitted? update it
    const existing = await Submission.findOne({ assignmentId, studentId: req.user._id });
    if (existing) {
      const updated = await Submission.findByIdAndUpdate(existing._id,
        { submissionLink, content, submittedAt: new Date(), status: 'submitted', seenByInstructor: false },
        { new: true }
      );
      return res.json({ success: true, message: 'Submission updated', submission: updated });
    }

    const status     = new Date() > new Date(assignment.dueDate) ? 'late' : 'submitted';
    const submission = await Submission.create({
      assignmentId, studentId: req.user._id, courseId: assignment.courseId,
      instructorId, submissionLink, content, status,
    });
    res.status(201).json({ success: true, message: 'Assignment submitted!', submission });
  } catch (e) { res.status(500).json({ success: false, message: 'Submit failed: ' + e.message }); }
});

// ── POST create assignment
router.post('/', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const assignment = await Assignment.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, assignment });
  } catch (e) { res.status(500).json({ success: false, message: 'Create failed: ' + e.message }); }
});

// ── PUT grade submission
router.put('/grade/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const submission = await Submission.findByIdAndUpdate(req.params.id,
      { grade, feedback, status: 'graded' }, { new: true }
    );
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
    res.json({ success: true, submission });
  } catch (e) { res.status(500).json({ success: false, message: 'Grade failed' }); }
});

// ── PUT mark seen
router.put('/:id/seen', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    await Submission.findByIdAndUpdate(req.params.id, { seenByInstructor: true });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ── PUT update assignment
router.put('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!assignment) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, assignment });
  } catch (e) { res.status(500).json({ success: false, message: 'Update failed' }); }
});

// ── DELETE assignment
router.delete('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    await Submission.deleteMany({ assignmentId: req.params.id });
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (e) { res.status(500).json({ success: false, message: 'Delete failed' }); }
});

// ── GET single assignment by ID (wildcard LAST)
router.get('/:id', protect, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('courseId', 'title');
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, assignment });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
