const mongoose = require('mongoose');

const nutritionSchema = new mongoose.Schema({
  servingSize: String,
  servingsPerContainer: Number,
  calories: Number,
  protein: Number,
  carbohydrates: Number,
  fat: Number,
  fiber: Number,
  sodium: Number,
  bcaa: String,
  eaa: String,
  digestiveEnzymes: String
}, { _id: false });

const variantSchema = new mongoose.Schema({
  flavor: String,
  size: String,
  weight: String,
  servings: Number,
  sku: { type: String, sparse: true },
  price: { type: Number, required: true },
  originalPrice: Number,
  mrp: Number,
  discount: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  status: { type: String, enum: ['in_stock', 'low_stock', 'out_of_stock'], default: 'in_stock' },
  image: String,
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  brand: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: false },
  description: { type: String, required: true },
  shortDescription: String,
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 }
  }],
  variants: [variantSchema],
  basePrice: { type: Number, required: true },
  mrp: { type: Number, required: true },
  priceNotConfigured: { type: Boolean, default: false },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  nutrition: nutritionSchema,
  ingredients: String,
  howToUse: String,
  benefits: String,
  tags: [String],
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  badge: String,
  status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'active' },
  minPrice: Number,
  maxPrice: Number,
  totalStock: Number,
  subcategory: String,
  isFeatured: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isNew: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  viewCount: { type: Number, default: 0 },
  costPrice: { type: Number, default: 0 },
  unitsSold: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 }
}, { timestamps: true, strict: false, suppressReservedKeysWarning: true, collection: 'Product' });

// Text index for search
productSchema.index({ name: 'text', brand: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema, 'Product');