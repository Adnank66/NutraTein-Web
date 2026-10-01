const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const mockDb = require('../utils/mockDb');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');
const { logAdminAction } = require('../utils/adminLogger');
const { sendEmail } = require('../services/emailService');

const VALID_STATUSES = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'
];

// Helper to check delayed delivery
function isOrderDelayed(order) {
  const terminalStatuses = ['DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURNED'];
  if (terminalStatuses.includes(order.status)) return false;
  if (!order.expectedDeliveryDate) return false;
  return new Date() > new Date(order.expectedDeliveryDate);
}

// POST /api/orders - Place order
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod = 'COD', couponCode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order.' });
    }

    let subtotal = 0;
    let costAmount = 0;
    const orderItems = [];

    for (const item of items) {
      let product;
      if (!global.USE_MONGODB) {
        product = mockDb.products.find(p => String(p._id) === String(item.productId));
      } else {
        product = await Product.findById(item.productId);
      }

      let effectivePrice = product ? (product.variants?.[0]?.price || product.basePrice) : Number(item.price);
      if (mockDb.flashSales) {
        const now = new Date();
        const activeSale = mockDb.flashSales.find(s => 
          s.isActive && 
          new Date(s.startAt) <= now && 
          new Date(s.endAt) >= now && 
          (s.products || []).includes(String(item.productId))
        );
        if (activeSale) {
          const salePrice = activeSale.discountType === 'PERCENT'
            ? Math.round(effectivePrice * (1 - activeSale.discountValue / 100))
            : Math.max(0, effectivePrice - activeSale.discountValue);
          effectivePrice = Math.min(effectivePrice, salePrice);
        }
      }
      const price = effectivePrice;
      const costPrice = product && product.costPrice ? product.costPrice : Math.round(price * 0.6);
      const name = product ? product.name : item.name;
      const image = product && product.images && product.images[0] ? product.images[0].url : item.image;
      const qty = Number(item.quantity) || 1;

      subtotal += price * qty;
      costAmount += costPrice * qty;

      orderItems.push({
        productId: item.productId,
        productName: name,
        productImage: image,
        flavor: item.flavor || '',
        size: item.size || '',
        quantity: qty,
        price
      });

      // Update product unitsSold if mockDb
      if (!global.USE_MONGODB && product) {
        product.unitsSold = (product.unitsSold || 0) + qty;
        product.totalRevenue = (product.totalRevenue || 0) + (price * qty);
      }
    }

    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const cCode = couponCode.trim().toUpperCase();
      let coupon;
      if (!global.USE_MONGODB) {
        coupon = mockDb.coupons.find(c => c.code === cCode && c.isActive);
      } else {
        coupon = await Coupon.findOne({ code: cCode, isActive: true });
      }

      if (coupon) {
        const now = new Date();
        const isNotExpired = !coupon.expiresAt || new Date(coupon.expiresAt) >= now;
        const isStarted = !coupon.startDate || new Date(coupon.startDate) <= now;
        const isWithinLimit = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
        const meetsMin = !coupon.minOrderValue || subtotal >= coupon.minOrderValue;

        if (isNotExpired && isStarted && isWithinLimit && meetsMin) {
          if (coupon.discountType === 'PERCENT') {
            discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
          } else {
            discountAmount = Number(coupon.discountValue);
          }
          discountAmount = Math.min(discountAmount, subtotal);
          appliedCoupon = coupon;

          // Record coupon usage
          coupon.usedCount = (coupon.usedCount || 0) + 1;
          coupon.totalDiscountGenerated = (coupon.totalDiscountGenerated || 0) + discountAmount;
          if (Array.isArray(coupon.usedBy)) {
            coupon.usedBy.push(req.user._id);
          }
          if (global.USE_MONGODB) {
            await coupon.save();
          }
        }
      }
    }

    const shippingAmount = subtotal > 999 ? 0 : 99;
    const taxAmount = Math.round(subtotal * 0.05); // 5% GST included
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingAmount);

    const now = new Date();
    const expDelivery = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    const expShipping = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    if (!global.USE_MONGODB) {
      const seq = mockDb.orders.length + 1;
      const orderNumber = 'PX-' + String(10000 + seq);
      const invoiceNumber = 'PX-INV-' + now.getFullYear() + '-' + String(seq).padStart(5, '0');

      const newOrder = {
        _id: 'ord_' + Date.now(),
        orderNumber,
        invoiceNumber,
        user: req.user,
        items: orderItems,
        shippingAddress,
        paymentMethod: paymentMethod || 'COD',
        paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
        subtotal,
        discountAmount: Math.round(discountAmount),
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        shippingAmount,
        taxAmount,
        costAmount,
        totalAmount,
        status: 'CONFIRMED',
        expectedShippingDate: expShipping,
        actualShippingDate: null,
        expectedDeliveryDate: expDelivery,
        actualDeliveryDate: null,
        deliveryTimeWindow: '10:00 AM - 06:00 PM',
        trackingNumber: 'TRK-' + Math.floor(10000000 + Math.random() * 90000000),
        shippingProvider: 'BlueDart Express',
        deliveryNotes: 'Standard priority delivery',
        history: [
          {
            status: 'CONFIRMED',
            changedAt: now,
            changedBy: 'CUSTOMER',
            comment: 'Order placed successfully by customer'
          }
        ],
        createdAt: now,
        updatedAt: now
      };
      mockDb.orders.unshift(newOrder);

      // Trigger order confirmation email alert
      const custEmail = req.user.email || (newOrder.shippingAddress && newOrder.shippingAddress.email);
      if (custEmail) {
        sendEmail(custEmail, 'order_placed', {
          customerName: req.user.name || 'Valued Athlete',
          orderNumber: newOrder.orderNumber,
          amount: newOrder.totalAmount.toLocaleString('en-IN'),
          processingDays: '1',
          deliveryDate: new Date(newOrder.expectedDeliveryDate).toLocaleDateString('en-IN', { month:'short', day:'numeric', year:'numeric' })
        }).catch(() => {});
      }

      // Check for low stock alerts on ordered products
      (newOrder.items || []).forEach(item => {
        const prod = (mockDb.products || []).find(p => String(p._id) === String(item.productId));
        if (prod) {
          prod.stock = Math.max(0, (prod.stock !== undefined ? prod.stock : 25) - (item.quantity || 1));
          const threshold = prod.lowStockThreshold || 10;
          if (prod.stock <= threshold) {
            const adminEmail = (mockDb.storeSettings?.emailSettings?.senderEmail) || 'kaziadnan275@gmail.com';
            sendEmail(adminEmail, 'lowStock', {
              productName: prod.name,
              currentStock: String(prod.stock),
              threshold: String(threshold)
            }).catch(() => {});
          }
        }
      });

      return res.status(201).json({ success: true, order: newOrder });
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
      subtotal,
      discountAmount,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      shippingAmount,
      taxAmount,
      costAmount,
      totalAmount,
      status: 'CONFIRMED',
      expectedShippingDate: expShipping,
      expectedDeliveryDate: expDelivery,
      deliveryTimeWindow: '10:00 AM - 06:00 PM',
      shippingProvider: 'BlueDart Express',
      trackingNumber: 'TRK-' + Math.floor(10000000 + Math.random() * 90000000),
      history: [
        {
          status: 'CONFIRMED',
          changedAt: now,
          changedBy: 'CUSTOMER',
          comment: 'Order placed successfully'
        }
      ]
    });

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/my
router.get('/my', protect, async (req, res) => {
  try {
    if (!global.USE_MONGODB) {
      const my = mockDb.orders.filter(o => 
        String(o.user?._id) === String(req.user._id) || 
        (o.user?.email && o.user.email === req.user.email)
      );
      return res.json({ success: true, orders: my });
    }
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/track
router.get('/track', async (req, res) => {
  try {
    const { orderNumber, trackingNumber } = req.query;
    if (!orderNumber && !trackingNumber) {
      return res.status(400).json({ success: false, message: 'Order ID or Tracking Number required' });
    }

    let order;
    if (!global.USE_MONGODB) {
      order = mockDb.orders.find(o => {
        if (orderNumber && (o.orderNumber?.toUpperCase() === orderNumber.toUpperCase() || String(o._id) === String(orderNumber))) return true;
        if (trackingNumber && o.trackingNumber?.toUpperCase() === trackingNumber.toUpperCase()) return true;
        return false;
      });
    } else {
      const query = {};
      if (orderNumber) query.orderNumber = orderNumber.toUpperCase();
      if (trackingNumber) query.trackingNumber = trackingNumber.toUpperCase();
      order = await Order.findOne({ $or: [{ orderNumber: query.orderNumber }, { trackingNumber: query.trackingNumber }] });
    }

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        invoiceNumber: order.invoiceNumber,
        status: order.status,
        items: order.items,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        shippingAmount: order.shippingAmount,
        expectedShippingDate: order.expectedShippingDate,
        actualShippingDate: order.actualShippingDate,
        expectedDeliveryDate: order.expectedDeliveryDate,
        actualDeliveryDate: order.actualDeliveryDate,
        deliveryTimeWindow: order.deliveryTimeWindow,
        trackingNumber: order.trackingNumber,
        shippingProvider: order.shippingProvider,
        deliveryNotes: order.deliveryNotes,
        history: order.history || [],
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders (admin)
router.get('/', protect, admin, async (req, res) => {
  try {
    const { search = '', status = 'all', delayed = 'false', dateRange = 'all' } = req.query;

    let ordersList = [];
    if (!global.USE_MONGODB) {
      ordersList = [...mockDb.orders];
    } else {
      ordersList = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    }

    let enriched = ordersList.map(o => {
      const plain = o.toObject ? o.toObject() : { ...o };
      plain.isDelayed = isOrderDelayed(plain);
      return plain;
    });

    // Filter by search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      enriched = enriched.filter(o => 
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.invoiceNumber && o.invoiceNumber.toLowerCase().includes(q)) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q)) ||
        (o.user?.name && o.user.name.toLowerCase().includes(q)) ||
        (o.user?.email && o.user.email.toLowerCase().includes(q)) ||
        (o.shippingAddress?.fullName && o.shippingAddress.fullName.toLowerCase().includes(q)) ||
        (o.shippingAddress?.city && o.shippingAddress.city.toLowerCase().includes(q))
      );
    }

    // Filter by status
    if (status && status !== 'all') {
      enriched = enriched.filter(o => o.status.toUpperCase() === status.toUpperCase());
    }

    // Filter by delayed
    if (delayed === 'true') {
      enriched = enriched.filter(o => o.isDelayed);
    }

    // Filter by date range
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let days = 0;
      if (dateRange === 'today') days = 1;
      else if (dateRange === '7days') days = 7;
      else if (dateRange === '30days') days = 30;

      if (days > 0) {
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        enriched = enriched.filter(o => new Date(o.createdAt) >= cutoff);
      }
    }

    const totalOrders = ordersList.length;
    const pendingCount = ordersList.filter(o => ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED'].includes(o.status)).length;
    const deliveredCount = ordersList.filter(o => o.status === 'DELIVERED').length;
    const delayedCount = ordersList.filter(o => isOrderDelayed(o)).length;

    res.json({
      success: true,
      orders: enriched,
      stats: {
        totalOrders,
        pendingCount,
        deliveredCount,
        delayedCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/:id (admin or owner)
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    let order;

    if (!global.USE_MONGODB) {
      order = mockDb.orders.find(o => String(o._id) === String(id) || o.orderNumber === id);
    } else {
      order = await Order.findById(id).populate('user', 'name email phone');
      if (!order) {
        order = await Order.findOne({ orderNumber: id }).populate('user', 'name email phone');
      }
    }

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Ensure authorization (admin or order owner)
    if (req.user.role !== 'ADMIN' && String(order.user?._id || order.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const plain = order.toObject ? order.toObject() : { ...order };
    plain.isDelayed = isOrderDelayed(plain);

    res.json({ success: true, order: plain });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/orders/:id/status (admin)
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status, comment = '' } = req.body;
    const newStatus = status ? status.toUpperCase() : '';

    if (!VALID_STATUSES.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    let order;
    const now = new Date();

    if (!global.USE_MONGODB) {
      order = mockDb.orders.find(o => String(o._id) === String(req.params.id) || o.orderNumber === req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

      const prevStatus = order.status;
      order.status = newStatus;
      order.updatedAt = now;

      if (!order.history) order.history = [];
      order.history.push({
        status: newStatus,
        changedAt: now,
        changedBy: req.user.name || 'ADMIN',
        comment: comment || `Status changed from ${prevStatus} to ${newStatus}`
      });

      if (newStatus === 'SHIPPED' && !order.actualShippingDate) {
        order.actualShippingDate = now;
      }
      if (newStatus === 'DELIVERED' && !order.actualDeliveryDate) {
        order.actualDeliveryDate = now;
      }

      await logAdminAction({
        action: 'ORDER_STATUS_UPDATE',
        module: 'ORDERS',
        description: `Order ${order.orderNumber} status changed to ${newStatus}`,
        details: { previousStatus: prevStatus, newStatus, comment },
        adminId: req.user._id
      });

      // Dispatch customer email alerts on status changes
      const custEmail = (order.user && order.user.email) || (order.shippingAddress && order.shippingAddress.email);
      const custName = (order.user && order.user.name) || (order.shippingAddress && order.shippingAddress.fullName) || 'Valued Athlete';
      if (custEmail) {
        if (newStatus === 'SHIPPED') {
          sendEmail(custEmail, 'order_shipped', {
            customerName: custName,
            orderNumber: order.orderNumber,
            courier: order.shippingProvider || 'Blue Dart Express',
            trackingId: order.trackingNumber || 'TRK-' + Date.now(),
            deliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', { month:'short', day:'numeric' }) : '2-3 business days'
          }).catch(() => {});
        } else if (newStatus === 'DELIVERED') {
          sendEmail(custEmail, 'order_delivered', {
            customerName: custName,
            orderNumber: order.orderNumber
          }).catch(() => {});
        } else if (newStatus === 'CANCELLED') {
          sendEmail(custEmail, 'order_cancelled', {
            customerName: custName,
            orderNumber: order.orderNumber
          }).catch(() => {});
        }
      }

      return res.json({ success: true, order });
    }

    order = await Order.findById(req.params.id);
    if (!order) {
      order = await Order.findOne({ orderNumber: req.params.id });
    }
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const prevStatus = order.status;
    order.status = newStatus;
    order.history.push({
      status: newStatus,
      changedAt: now,
      changedBy: req.user.name || 'ADMIN',
      comment: comment || `Status changed from ${prevStatus} to ${newStatus}`
    });

    if (newStatus === 'SHIPPED' && !order.actualShippingDate) {
      order.actualShippingDate = now;
    }
    if (newStatus === 'DELIVERED' && !order.actualDeliveryDate) {
      order.actualDeliveryDate = now;
    }

    await order.save();

    await logAdminAction({
      action: 'ORDER_STATUS_UPDATE',
      module: 'ORDERS',
      description: `Order ${order.orderNumber} status changed to ${newStatus}`,
      details: { previousStatus: prevStatus, newStatus, comment },
      adminId: req.user._id
    });

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/orders/:id/shipping (admin) - Update shipping & delivery dates
router.put('/:id/shipping', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      expectedShippingDate,
      actualShippingDate,
      expectedDeliveryDate,
      actualDeliveryDate,
      deliveryTimeWindow,
      trackingNumber,
      shippingProvider,
      deliveryNotes
    } = req.body;

    let order;
    if (!global.USE_MONGODB) {
      order = mockDb.orders.find(o => String(o._id) === String(id) || o.orderNumber === id);
    } else {
      order = await Order.findById(id);
      if (!order) order = await Order.findOne({ orderNumber: id });
    }

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const orderCreated = new Date(order.createdAt);

    // Validation: Expected Delivery Date must be >= order creation date
    if (expectedDeliveryDate) {
      const expDel = new Date(expectedDeliveryDate);
      if (expDel < orderCreated) {
        return res.status(400).json({
          success: false,
          message: 'Expected Delivery Date cannot be earlier than the order creation date (' + orderCreated.toLocaleDateString() + ').'
        });
      }
    }

    // Validation: Expected Shipping Date cannot be later than Expected Delivery Date
    if (expectedShippingDate && expectedDeliveryDate) {
      const expShip = new Date(expectedShippingDate);
      const expDel = new Date(expectedDeliveryDate);
      if (expShip > expDel) {
        return res.status(400).json({
          success: false,
          message: 'Expected Shipping Date cannot be later than the Expected Delivery Date.'
        });
      }
    }

    const now = new Date();

    if (expectedShippingDate !== undefined) order.expectedShippingDate = expectedShippingDate ? new Date(expectedShippingDate) : null;
    if (actualShippingDate !== undefined) order.actualShippingDate = actualShippingDate ? new Date(actualShippingDate) : null;
    if (expectedDeliveryDate !== undefined) order.expectedDeliveryDate = expectedDeliveryDate ? new Date(expectedDeliveryDate) : null;
    if (actualDeliveryDate !== undefined) order.actualDeliveryDate = actualDeliveryDate ? new Date(actualDeliveryDate) : null;
    if (deliveryTimeWindow !== undefined) order.deliveryTimeWindow = deliveryTimeWindow;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (shippingProvider !== undefined) order.shippingProvider = shippingProvider;
    if (deliveryNotes !== undefined) order.deliveryNotes = deliveryNotes;

    if (!order.history) order.history = [];
    order.history.push({
      status: order.status,
      changedAt: now,
      changedBy: req.user.name || 'ADMIN',
      comment: `Shipping updated: ${shippingProvider || 'Courier'} (Tracking: ${trackingNumber || 'N/A'}, Expected Delivery: ${expectedDeliveryDate ? new Date(expectedDeliveryDate).toLocaleDateString() : 'N/A'})`
    });

    if (!global.USE_MONGODB) {
      order.updatedAt = now;
    } else {
      await order.save();
    }

    await logAdminAction({
      action: 'SHIPPING_UPDATE',
      module: 'SHIPPING',
      description: `Updated shipping & delivery details for order ${order.orderNumber}`,
      details: { trackingNumber, shippingProvider, expectedDeliveryDate, deliveryTimeWindow },
      adminId: req.user._id
    });

    res.json({
      success: true,
      message: 'Shipping & delivery details updated successfully.',
      order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders/:id/refund (admin) - Issue refund
router.post('/:id/refund', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { refundAmount, refundReason = 'Customer requested refund' } = req.body;

    let order;
    if (!global.USE_MONGODB) {
      order = mockDb.orders.find(o => String(o._id) === String(id) || o.orderNumber === id);
    } else {
      order = await Order.findById(id);
      if (!order) order = await Order.findOne({ orderNumber: id });
    }

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const numRefund = Number(refundAmount);
    if (isNaN(numRefund) || numRefund <= 0 || numRefund > order.totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Refund amount must be between ₹1 and total order value (₹${order.totalAmount}).`
      });
    }

    const now = new Date();
    order.status = 'REFUNDED';
    order.refundAmount = numRefund;
    order.refundReason = refundReason;
    order.refundStatus = 'COMPLETED';
    order.refundedAt = now;

    if (!order.history) order.history = [];
    order.history.push({
      status: 'REFUNDED',
      changedAt: now,
      changedBy: req.user.name || 'ADMIN',
      comment: `Refund of ₹${numRefund.toLocaleString('en-IN')} processed. Reason: ${refundReason}`
    });

    if (!global.USE_MONGODB) {
      order.updatedAt = now;
    } else {
      await order.save();
    }

    await logAdminAction({
      action: 'ORDER_REFUND',
      module: 'ORDERS',
      description: `Processed refund of ₹${numRefund} for order ${order.orderNumber}. Reason: ${refundReason}`,
      details: { refundAmount: numRefund, refundReason },
      adminId: req.user._id
    });

    res.json({
      success: true,
      message: `Refund of ₹${numRefund.toLocaleString('en-IN')} processed successfully.`,
      order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/export - Admin: Export orders as CSV filtered by date and status
router.get('/export/csv', protect, admin, async (req, res) => {
  try {
    const { status, from, to } = req.query;
    let list = [];

    if (!global.USE_MONGODB) {
      list = [...mockDb.orders];
    } else {
      list = await Order.find().populate('user', 'name email phone').sort({ createdAt: -1 });
    }

    if (status && status !== 'all') {
      list = list.filter(o => o.status === status);
    }
    if (from) {
      const fromDate = new Date(from);
      list = list.filter(o => new Date(o.createdAt) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      list = list.filter(o => new Date(o.createdAt) <= toDate);
    }

    const headers = [
      'Order Number', 'Invoice Number', 'Customer Name', 'Customer Email', 'Customer Phone',
      'Items Count', 'Item Names', 'Subtotal', 'Discount', 'Tax', 'Shipping', 'Total Amount',
      'Payment Method', 'Payment Status', 'Status', 'Placed Date'
    ];

    const rows = list.map(o => {
      const custName = o.user?.name || o.shippingAddress?.name || 'Guest';
      const custEmail = o.user?.email || '';
      const custPhone = o.user?.phone || o.shippingAddress?.phone || '';
      const itemNames = (o.items || []).map(i => `${i.productName || 'Product'} (x${i.quantity})`).join('; ');
      return [
        `"${o.orderNumber || o._id}"`,
        `"${o.invoiceNumber || ''}"`,
        `"${custName.replace(/"/g, '""')}"`,
        `"${custEmail.replace(/"/g, '""')}"`,
        `"${custPhone.replace(/"/g, '""')}"`,
        (o.items || []).length,
        `"${itemNames.replace(/"/g, '""')}"`,
        o.subtotal || 0,
        o.discountAmount || 0,
        o.taxAmount || 0,
        o.shippingAmount || 0,
        o.totalAmount || 0,
        `"${o.paymentMethod || 'COD'}"`,
        `"${o.paymentStatus || 'PENDING'}"`,
        `"${o.status || 'CONFIRMED'}"`,
        `"${new Date(o.createdAt).toISOString().slice(0, 10)}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    logAdminAction(req.user, 'ORDERS_EXPORTED', 'ORDERS', `Exported ${list.length} orders to CSV`, { count: list.length, filter: { status, from, to } });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="nutratein-orders-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Export failed: ' + err.message });
  }
});

// POST /api/orders/bulk-clear - Admin: Permanently clear / delete orders
router.post('/bulk-clear', protect, admin, async (req, res) => {
  try {
    const { orderIds, scope, status, search, dateRange } = req.body;
    let deletedCount = 0;

    if (Array.isArray(orderIds) && orderIds.length > 0) {
      const idStrings = orderIds.map(String);
      if (!global.USE_MONGODB) {
        const before = mockDb.orders.length;
        mockDb.orders = mockDb.orders.filter(o => !idStrings.includes(String(o._id)));
        deletedCount = before - mockDb.orders.length;
      } else {
        const resDel = await Order.deleteMany({ _id: { $in: orderIds } });
        deletedCount = resDel.deletedCount || 0;
      }
    } else if (scope === 'all') {
      if (!global.USE_MONGODB) {
        deletedCount = mockDb.orders.length;
        mockDb.orders = [];
      } else {
        const resDel = await Order.deleteMany({});
        deletedCount = resDel.deletedCount || 0;
      }
    } else {
      if (!global.USE_MONGODB) {
        let toDelete = [...mockDb.orders];
        if (status && status !== 'all') {
          toDelete = toDelete.filter(o => (o.status || '').toUpperCase() === status.toUpperCase());
        }
        if (search && search.trim()) {
          const s = search.toLowerCase().trim();
          toDelete = toDelete.filter(o =>
            (o.orderNumber && o.orderNumber.toLowerCase().includes(s)) ||
            (o.user?.name && o.user.name.toLowerCase().includes(s)) ||
            (o.user?.email && o.user.email.toLowerCase().includes(s)) ||
            (o.shippingAddress?.fullName && o.shippingAddress.fullName.toLowerCase().includes(s))
          );
        }
        const delIds = toDelete.map(o => String(o._id));
        mockDb.orders = mockDb.orders.filter(o => !delIds.includes(String(o._id)));
        deletedCount = delIds.length;
      } else {
        const query = {};
        if (status && status !== 'all') query.status = status;
        const resDel = await Order.deleteMany(query);
        deletedCount = resDel.deletedCount || 0;
      }
    }

    logAdminAction(req.user, 'ORDERS_BULK_CLEARED', 'ORDERS', `Bulk cleared ${deletedCount} orders from database (Scope: ${scope || 'selected'})`, { count: deletedCount, scope });
    res.json({ success: true, count: deletedCount, message: `Successfully cleared ${deletedCount} order(s) from database.` });
  } catch (err) {
    console.error('Error clearing orders:', err);
    res.status(500).json({ success: false, message: 'Failed to clear orders: ' + err.message });
  }
});

module.exports = router;

