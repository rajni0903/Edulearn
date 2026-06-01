/**
 * Enrollment Model - student course enrollment + video progress tracking
 */
const mongoose = require('mongoose');

// Track which videos a student has completed
const videoProgressSchema = new mongoose.Schema({
  videoId:     { type: String, required: true },  // video._id as string
  completed:   { type: Boolean, default: false },
  completedAt: { type: Date },
}, { _id: false });

const enrollmentSchema = new mongoose.Schema(
  {
    studentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    courseId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    // Overall progress 0-100%
    progress:   { type: Number, default: 0, min: 0, max: 100 },
    // Per-video tracking
    videoProgress: [videoProgressSchema],
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId }],
    completedAt:       { type: Date, default: null },
    certificateIssued: { type: Boolean, default: false },
    isActive:          { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Unique: one enrollment per student per course
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
module.exports = mongoose.model('Enrollment', enrollmentSchema);
