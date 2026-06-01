/**
 * Submission Model
 * Students submit either a PDF link or paste an external link
 */
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: true },
    courseId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course',     required: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Student submission: a URL (PDF link, Drive, GitHub, etc.)
    submissionLink: { type: String, default: '' },
    // Friendly label for submission type
    submissionType: { type: String, enum: ['link', 'pdf'], default: 'link' },
    content:    { type: String, default: '' },  // optional notes
    status:     { type: String, enum: ['submitted', 'late', 'graded'], default: 'submitted' },
    submittedAt:{ type: Date, default: Date.now },
    grade:      { type: Number, default: null },
    feedback:   { type: String, default: '' },
    seenByInstructor: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);
