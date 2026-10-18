const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'PLACED',
        'CONFIRMED',
        'PROCESSING',
        'PACKED',
        'SHIPPED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'RETURNED',
      ],
      default: 'PLACED',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'UPI', 'CARD', 'NETBANKING', 'CASH'],
      default: 'COD',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      index: true,
    },
    customerPhone: {
      type: String,
      trim: true,
      default: null,
    },
    couponCode: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    estimatedDelivery: {
      type: Date,
      default: null,
    },
    deliveryStatus: {
      type: String,
      default: 'ORDER_PLACED',
      index: true,
    },
    estimatedDeliveryDate: {
      type: Date,
      default: null,
    },
    manualDeliveryDate: {
      type: Date,
      default: null,
    },
    manualDeliveryTime: {
      type: String,
      default: null,
    },
    courierPartner: {
      type: String,
      default: null,
    },
    trackingNumber: {
      type: String,
      default: null,
    },
    deliveryStatusHistory: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    packagingVideoUrl: {
      type: String,
      default: null,
    },
    whatsappOptIn: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'Order',
  }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema, 'Order');
