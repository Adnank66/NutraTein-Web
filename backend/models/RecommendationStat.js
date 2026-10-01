const mongoose = require('mongoose');

const recommendationStatSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  productName: { type: String, required: true },
  category: { type: String },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  cartAdds: { type: Number, default: 0 },
  purchases: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  recommendedWith: [{
    productId: String,
    productName: String,
    coPurchaseCount: { type: Number, default: 1 }
  }]
}, { timestamps: true });

module.exports = mongoose.model('RecommendationStat', recommendationStatSchema);
