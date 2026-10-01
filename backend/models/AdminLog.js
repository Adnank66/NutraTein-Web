const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  adminId: { type: String, required: true },
  adminName: { type: String, required: true },
  adminEmail: { type: String },
  action: { type: String, required: true },
  module: {
    type: String,
    enum: ['COUPONS', 'ORDERS', 'PRODUCTS', 'SHIPPING', 'INVOICES', 'AUTH', 'SETTINGS', 'SYSTEM'],
    required: true
  },
  description: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String, default: '127.0.0.1' },
  userAgent: { type: String }
}, { timestamps: true });

adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ module: 1 });
adminLogSchema.index({ action: 1 });

module.exports = mongoose.model('AdminLog', adminLogSchema);
