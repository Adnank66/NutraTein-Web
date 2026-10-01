const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: String,
  discountType: { type: String, enum: ['PERCENT', 'FIXED'], default: 'PERCENT' },
  discountValue: { type: Number, required: true, min: 0 },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: Number,
  usageLimit: Number,
  perCustomerLimit: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  totalDiscountGenerated: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now },
  expiresAt: Date,
  usedBy: [{
    userId: String,
    email: String,
    orderId: String,
    discountAmount: Number,
    usedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true, strict: false, collection: 'Coupon' });

module.exports = mongoose.model('Coupon', couponSchema, 'Coupon');