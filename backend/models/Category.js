const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: String,
  image: { type: String, default: '' },
  icon: { type: String, default: '💊' },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true, strict: false, collection: 'Category' });

module.exports = mongoose.model('Category', categorySchema, 'Category');