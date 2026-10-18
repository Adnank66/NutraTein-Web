const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      default: null,
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 1,
    },
    price: {
      type: Number,
      required: [true, 'Item price is required'],
      min: 0,
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    flavor: {
      type: String,
      default: null,
    },
    size: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'OrderItem',
  }
);


module.exports = mongoose.models.OrderItem || mongoose.model('OrderItem', orderItemSchema, 'OrderItem');
