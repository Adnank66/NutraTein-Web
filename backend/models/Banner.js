const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: String,
  description: String,
  image: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  mobileImageUrl: { type: String, default: '' },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  videoUrl: { type: String, default: '' },
  videoAutoplay: { type: Boolean, default: true },
  videoMuted: { type: Boolean, default: true },
  videoLoop: { type: Boolean, default: true },
  buttonText: String,
  buttonLink: String,
  link: String,
  cta: String,
  placement: {
    type: String,
    enum: [
      'Homepage Hero',
      'Homepage Promotional Section',
      'Shop Page',
      'Product Category',
      'Offers Section',
      'Custom Section'
    ],
    default: 'Homepage Hero'
  },
  position: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  startDate: Date,
  endDate: Date,
  scheduledStart: Date,
  scheduledEnd: Date,
  badge: String,
  bgColor: { type: String, default: '#000000' },
  theme: { type: String, enum: ['light', 'dark'], default: 'dark' }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);