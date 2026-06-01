const mongoose = require('mongoose');

// Each video/lesson stored inside course itself
const videoSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  titleHindi: { type: String, default: '' },
  youtubeUrl: { type: String, required: true },
  // auto-extracted from YouTube URL
  youtubeId:  { type: String, default: '' },
  thumbnail:  { type: String, default: '' },
  duration:   { type: String, default: '' },
  order:      { type: Number, default: 1 },
});

const courseSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    // Dynamic category — no enum restriction so admin-created categories work
    category: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnail:  { type: String, default: '' },
    duration:   { type: String, default: '0 hours' },
    level:      { type: String, enum: ['Beginner','Intermediate','Advanced'], default: 'Beginner' },
    price:      { type: Number, default: 0 },
    instructorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    instructorName: { type: String },
    // YouTube playlist videos array
    videos: [videoSchema],
    // YouTube playlist URL (optional bulk import)
    playlistUrl: { type: String, default: '' },
    tags:   [String],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalStudents: { type: Number, default: 0 },
    isPublished:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
