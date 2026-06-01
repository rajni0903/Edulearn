const express  = require('express');
const router   = express.Router();
const { body, validationResult } = require('express-validator');
const Course   = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { protect, authorize } = require('../middleware/auth');

// Helper: extract YouTube video ID from any YT URL
const getYouTubeId = (url) => {
  if (!url) return '';
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : '';
};

// ─── GET ALL COURSES ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, level, search, page = 1, limit = 12 } = req.query;
    const q = { isPublished: true };
    if (category) q.category = category;
    if (level)    q.level    = level;
    if (search)   q.title    = { $regex: search, $options: 'i' };

    const total   = await Course.countDocuments(q);
    const courses = await Course.find(q)
      .populate('instructorId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(+limit);

    res.json({ success: true, count: courses.length, total, pages: Math.ceil(total / limit), currentPage: +page, courses });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ─── INSTRUCTOR'S OWN COURSES ─────────────────────────────────────────────────
router.get('/instructor/my-courses', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const courses = await Course.find({ instructorId: req.user._id }).sort({ createdAt: -1 });
    const coursesWithStats = await Promise.all(
      courses.map(async (c) => {
        const students = await Enrollment.countDocuments({ courseId: c._id });
        return { ...c.toObject(), enrolledStudents: students };
      })
    );
    res.json({ success: true, courses: coursesWithStats });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ─── GET SINGLE COURSE ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructorId', 'name avatar bio');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const totalStudents = await Enrollment.countDocuments({ courseId: course._id });
    res.json({ success: true, course: { ...course.toObject(), totalStudents } });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ─── CREATE COURSE ────────────────────────────────────────────────────────────
router.post('/', protect, authorize('instructor', 'admin'),
  [
    body('title').trim().notEmpty().withMessage('Title required'),
    body('description').trim().notEmpty().withMessage('Description required'),
    body('category').notEmpty().withMessage('Category required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
    try {
      const { videos = [], ...rest } = req.body;
      // Process videos — extract YouTube IDs and auto-thumbnails
      const processedVideos = videos.map((v, i) => {
        const ytId = getYouTubeId(v.youtubeUrl);
        return {
          ...v,
          youtubeId: ytId,
          thumbnail: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '',
          order: v.order || i + 1,
        };
      });
      const course = await Course.create({
        ...rest,
        videos: processedVideos,
        instructorId:   req.user._id,
        instructorName: req.user.name,
        // If no custom thumbnail, use first video thumbnail
        thumbnail: rest.thumbnail || (processedVideos[0]?.thumbnail) || '',
      });
      res.status(201).json({ success: true, course });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
  }
);

// ─── UPDATE COURSE (title, price, description, etc.) ─────────────────────────
router.put('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, course: updated });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ─── ADD VIDEO TO COURSE ──────────────────────────────────────────────────────
router.post('/:id/videos', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    const { title, titleHindi = '', youtubeUrl, duration = '' } = req.body;
    const ytId = getYouTubeId(youtubeUrl);
    const newVideo = {
      title,
      titleHindi,
      youtubeUrl,
      youtubeId: ytId,
      thumbnail: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '',
      duration,
      order: course.videos.length + 1,
    };
    course.videos.push(newVideo);
    await course.save();
    res.status(201).json({ success: true, video: course.videos[course.videos.length - 1], course });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ─── UPDATE VIDEO ────────────────────────────────────────────────────────────
router.put('/:id/videos/:videoId', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    const video = course.videos.id(req.params.videoId);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    const { title, titleHindi, youtubeUrl, duration } = req.body;
    if (title)      video.title = title;
    if (titleHindi !== undefined) video.titleHindi = titleHindi;
    if (duration)   video.duration = duration;
    if (youtubeUrl) {
      video.youtubeUrl = youtubeUrl;
      const ytId = getYouTubeId(youtubeUrl);
      video.youtubeId = ytId;
      video.thumbnail = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';
    }
    await course.save();
    res.json({ success: true, course });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ─── DELETE VIDEO ────────────────────────────────────────────────────────────
router.delete('/:id/videos/:videoId', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    course.videos = course.videos.filter(v => v._id.toString() !== req.params.videoId);
    // Re-order
    course.videos.forEach((v, i) => { v.order = i + 1; });
    await course.save();
    res.json({ success: true, message: 'Video deleted', course });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ─── DELETE COURSE ────────────────────────────────────────────────────────────
router.delete('/:id', protect, authorize('admin', 'instructor'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Course deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
