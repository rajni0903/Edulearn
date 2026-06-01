const mongoose = require('mongoose');

// Lesson model kept for backward compatibility
// New video storage is inside Course.videos array
const lessonSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title:    { type: String, required: true, trim: true },
    videoUrl: { type: String, default: '' },
    notes:    { type: String, default: '' },
    duration: { type: String, default: '0 min' },
    order:    { type: Number, default: 1 },
    isFree:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lesson', lessonSchema);
