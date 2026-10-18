const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['PRODUCT', 'GOAL'],
      default: 'PRODUCT',
      index: true,
    },
    linkedCategorySlug: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: null,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'Category',
  }
);

module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema, 'Category');
