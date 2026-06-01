/**
 * QUIZ ROUTES - /api/quizzes
 * NOTE: Specific routes MUST come before /:id wildcard
 */
const express  = require('express');
const router   = express.Router();
const { Quiz, QuizResult } = require('../models/Quiz');
const Enrollment = require('../models/Enrollment');
const { protect, authorize } = require('../middleware/auth');

const ok  = (res, data)          => res.status(200).json({ success: true, ...data });
const err = (res, msg, code=500) => res.status(code).json({ success: false, message: msg });

// ── GET quizzes for a course (specific FIRST)
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { courseId: req.params.courseId };
    if (type) filter.type = type;
    const quizzes = await Quiz.find(filter);
    const sanitized = quizzes.map(q => {
      const obj = q.toObject();
      if (req.user.role === 'student') {
        obj.questions = obj.questions.map(({ question, questionHindi, options, optionsHindi, marks, _id }) =>
          ({ question, questionHindi, options, optionsHindi, marks, _id })
        );
      }
      return obj;
    });
    return ok(res, { quizzes: sanitized });
  } catch (e) { return err(res, 'Server error'); }
});

// ── GET student's quiz results (specific BEFORE /:id)
router.get('/results/my', protect, async (req, res) => {
  try {
    const results = await QuizResult.find({ studentId: req.user._id })
      .populate('quizId', 'title type courseId').sort({ createdAt: -1 });
    return ok(res, { results });
  } catch (e) { return err(res, 'Server error'); }
});

// ── POST create quiz
router.post('/', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.create({ ...req.body, createdBy: req.user._id });
    return ok(res, { quiz });
  } catch (e) {
    console.error('[quiz create]', e.message);
    return err(res, 'Failed to create quiz: ' + e.message);
  }
});

// ── POST submit quiz (specific BEFORE /:id)
router.post('/submit', protect, async (req, res) => {
  try {
    const { quizId, answers, timeTaken = 0 } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return err(res, 'Quiz not found', 404);

    let score = 0, totalMarks = 0;
    quiz.questions.forEach((q, i) => {
      totalMarks += q.marks;
      if (answers[i] === q.correctAnswer) score += q.marks;
    });

    const percentage   = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const passingScore = quiz.type === 'exam' ? 75 : quiz.passingScore;
    const passed       = percentage >= passingScore;

    if (quiz.type === 'exam' && passed) {
      await Enrollment.findOneAndUpdate(
        { studentId: req.user._id, courseId: quiz.courseId },
        { certificateIssued: true, completedAt: new Date(), progress: 100 }
      );
    }

    await QuizResult.create({
      quizId, studentId: req.user._id,
      answers, score, totalMarks, percentage, passed, timeTaken,
      certificateGenerated: quiz.type === 'exam' && passed,
    });

    return ok(res, {
      result: {
        score, totalMarks, percentage, passed, passingScore,
        quizType: quiz.type,
        correctAnswers: quiz.questions.map(q => q.correctAnswer),
      },
    });
  } catch (e) {
    console.error('[quiz submit]', e);
    return err(res, 'Submit failed: ' + e.message);
  }
});

// ── PUT update quiz
router.put('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: false });
    if (!quiz) return err(res, 'Quiz not found', 404);
    return ok(res, { quiz });
  } catch (e) { return err(res, 'Update failed: ' + e.message); }
});

// ── DELETE quiz
router.delete('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return err(res, 'Quiz not found', 404);
    await QuizResult.deleteMany({ quizId: req.params.id });
    return ok(res, { message: 'Quiz deleted' });
  } catch (e) { return err(res, 'Delete failed'); }
});

// ── GET single quiz (wildcard LAST)
router.get('/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return err(res, 'Quiz not found', 404);
    const obj = quiz.toObject();
    if (req.user.role === 'student') {
      obj.questions = obj.questions.map(({ question, questionHindi, options, optionsHindi, marks, _id }) =>
        ({ question, questionHindi, options, optionsHindi, marks, _id })
      );
    }
    return ok(res, { quiz: obj });
  } catch (e) { return err(res, 'Server error'); }
});

module.exports = router;
