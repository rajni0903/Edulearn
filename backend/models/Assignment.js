/**
 * Assignment Model
 * Instructor can upload via PDF file URL or external PDF/Drive link
 * Student submits via PDF URL or link
 */
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    courseId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    // Instructor upload: either a file URL (uploaded PDF) or external Drive/PDF link
    attachmentUrl:  { type: String, default: '' },  // PDF file or Drive link
    attachmentType: { type: String, enum: ['none', 'pdf', 'link'], default: 'none' },
    dueDate:     { type: Date, required: true },
    maxMarks:    { type: Number, default: 100 },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
