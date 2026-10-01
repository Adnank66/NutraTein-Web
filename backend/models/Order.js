const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: String,
  productImage: String,
  flavor: String,
  size: String,
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }
}, { _id: true });

const trackingSchema = new mongoose.Schema({
  status: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
  location: String
}, { _id: false });

const orderHistorySchema = new mongoose.Schema({
  status: String,
  timestamp: { type: Date, default: Date.now },
  note: String,
  updatedBy: { type: String, default: 'System' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  invoiceNumber: { type: String, unique: true, sparse: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    name: String,
    phone: String,
    houseFlat: String,
    street: String,
    area: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  status: {
    type: String,
    enum: [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'PACKED',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'RETURNED',
      'REFUNDED'
    ],
    default: 'CONFIRMED'
  },
  paymentMethod: { type: String, enum: ['COD', 'UPI', 'CARD', 'NETBANKING'], default: 'COD' },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], default: 'PENDING' },
  subtotal: Number,
  discountAmount: { type: Number, default: 0 },
  shippingAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  costAmount: { type: Number, default: 0 },
  totalAmount: Number,
  couponCode: String,
  
  // Shipping & Delivery fields
  expectedShippingDate: Date,
  actualShippingDate: Date,
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  deliveryTimeWindow: { type: String, default: 'Standard (10 AM - 6 PM)' },
  trackingNumber: String,
  shippingProvider: String,
  deliveryNotes: String,

  tracking: [trackingSchema],
  history: [orderHistorySchema],
  estimatedDelivery: Date,
  notes: String
}, { timestamps: true, strict: false, collection: 'Order' });

// Generate order number and invoice number before save
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = 'PX' + String(count + 1).padStart(6, '0');
  }
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Order').countDocuments();
    this.invoiceNumber = `PX-INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema, 'Order');