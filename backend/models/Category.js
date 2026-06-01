/**
 * Category Model
 * Admin can add/edit/delete categories
 * Linked to courses via category name
 */
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '' },
    color:       { type: String, default: '#0d6efd' }, // display color
    icon:        { type: String, default: 'bi-grid' },  // bootstrap icon class
    isActive:    { type: Boolean, default: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
