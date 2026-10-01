const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true },
  body: { type: String, required: true, minlength: 10 },
  isVerifiedPurchase: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true },
  helpful: { type: Number, default: 0 }
}, { timestamps: true, strict: false, collection: 'Review' });

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema, 'Review');