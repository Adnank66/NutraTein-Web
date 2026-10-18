const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
      default: 'NUTRATEIN',
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    shortDesc: {
      type: String,
      default: null,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
      index: true,
    },
    goalCategoryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: 0,
    },
    mrp: {
      type: Number,
      required: [true, 'MRP is required'],
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },
    isNew: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    stockQuantity: {
      type: Number,
      default: 0,
    },
    sku: {
      type: String,
      default: null,
    },
    howToUse: {
      type: String,
      default: null,
    },
    ingredients: {
      type: String,
      default: null,
    },
    benefits: {
      type: String,
      default: null,
    },
    nutritionInfo: {
      type: String,
      default: null,
    },
    tags: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'Product',
    suppressReservedKeysWarning: true,
  }
);

productSchema.index({ categoryId: 1, isActive: 1 });
productSchema.index({ isActive: 1, isBestSeller: 1 });
productSchema.index({ isActive: 1, rating: -1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema, 'Product');
