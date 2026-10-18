const mongoose = require('mongoose');

const productImageSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true,
    },
    url: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    alt: {
      type: String,
      default: null,
    },
    isPrimary: {
      type: Boolean,
      default: false,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'ProductImage',
  }
);

productImageSchema.index({ productId: 1, isPrimary: 1 });

module.exports = mongoose.models.ProductImage || mongoose.model('ProductImage', productImageSchema, 'ProductImage');
