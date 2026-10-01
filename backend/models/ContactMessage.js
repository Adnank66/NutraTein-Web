const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  subject: { type: String, trim: true, default: 'General Inquiry' },
  message: { type: String, required: true },
  status: { type: String, enum: ['NEW', 'IN_PROGRESS', 'RESOLVED'], default: 'NEW' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.models.ContactMessage || mongoose.model('ContactMessage', ContactMessageSchema);
