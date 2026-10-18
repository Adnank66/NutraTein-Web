const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true,
    },
    flavor: {
      type: String,
      default: null,
    },
    size: {
      type: String,
      default: null,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Variant price is required'],
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'ProductVariant',
  }
);

productVariantSchema.index({ productId: 1, isActive: 1 });

module.exports = mongoose.models.ProductVariant || mongoose.model('ProductVariant', productVariantSchema, 'ProductVariant');
