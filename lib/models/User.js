const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    whatsappOptIn: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN', 'SUPER_ADMIN', 'user', 'admin'],
      default: 'USER',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'User',
  }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema, 'User');
