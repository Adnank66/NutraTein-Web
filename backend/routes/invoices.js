const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const mockDb = require('../utils/mockDb');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');

const COMPANY_DETAILS = {
  name: 'NUTRATEIN NUTRITION INDIA PVT. LTD.',
  brand: 'NUTRATEIN',
  tagline: "India's #1 Premium Fitness Nutrition Brand",
  address: 'Level 5, Nexus Fitness Tech Park, Andheri East, Mumbai, Maharashtra - 400069',
  gstin: '27AABCP1234F1Z5',
  pan: 'AABCP1234F',
  cin: 'U24239MH2024PTC987654',
  supportEmail: 'kaziadnan275@gmail.com',
  supportPhone: '+91 98765 43210',
  website: 'https://nutratein.in'
};

// Helper to format invoice response
function buildInvoiceData(order) {
  const plain = order.toObject ? order.toObject() : { ...order };
  
  // Calculate itemized tax (5% GST embedded or applied)
  const items = (plain.items || []).map(item => {
    const totalItemPrice = (item.price || 0) * (item.quantity || 1);
    const taxRate = 0.05; // 5% GST on dietary supplements
    const taxableValue = Math.round(totalItemPrice / (1 + taxRate));
    const taxAmount = totalItemPrice - taxableValue;
    return {
      productId: item.productId,
      productName: item.productName || 'Protein Supplement',
      flavor: item.flavor || 'Standard',
      size: item.size || '1 kg',
      quantity: item.quantity || 1,
      unitPrice: item.price || 0,
      taxableValue,
      taxRate: '5%',
      taxAmount,
      total: totalItemPrice
    };
  });

  const subtotal = plain.subtotal || 0;
  const discountAmount = plain.discountAmount || 0;
  const shippingAmount = plain.shippingAmount || 0;
  const taxAmount = plain.taxAmount || Math.round(subtotal * 0.05);
  const totalAmount = plain.totalAmount || (subtotal - discountAmount + shippingAmount);
  const refundAmount = plain.refundAmount || 0;
  const netPaid = Math.max(0, totalAmount - refundAmount);

  return {
    invoiceNumber: plain.invoiceNumber || ('NT-INV-2026-' + String(plain._id || '00001').slice(-5)),
    invoiceDate: plain.createdAt,
    orderId: plain._id,
    orderNumber: plain.orderNumber || 'NT-00000',
    orderStatus: plain.status,
    paymentMethod: plain.paymentMethod || 'COD',
    paymentStatus: plain.paymentStatus || (plain.paymentMethod === 'COD' ? 'PENDING' : 'PAID'),
    customer: {
      name: plain.shippingAddress?.fullName || plain.user?.name || 'Valued Customer',
      email: plain.user?.email || 'customer@example.com',
      phone: plain.shippingAddress?.phone || plain.user?.phone || '+91 9876543210',
      shippingAddress: {
        addressLine: plain.shippingAddress?.addressLine || 'N/A',
        city: plain.shippingAddress?.city || '',
        state: plain.shippingAddress?.state || '',
        postalCode: plain.shippingAddress?.postalCode || '',
        country: plain.shippingAddress?.country || 'India'
      }
    },
    company: COMPANY_DETAILS,
    items,
    pricing: {
      subtotal,
      couponCode: plain.couponCode || null,
      discountAmount,
      taxAmount,
      shippingAmount,
      totalAmount,
      refundAmount,
      netPaid
    },
    shipping: {
      provider: plain.shippingProvider || 'BlueDart Express',
      trackingNumber: plain.trackingNumber || 'TRK-98765432',
      deliveryTimeWindow: plain.deliveryTimeWindow || '10:00 AM - 06:00 PM',
      expectedDeliveryDate: plain.expectedDeliveryDate,
      actualDeliveryDate: plain.actualDeliveryDate
    },
    notes: 'Thank you for choosing NUTRATEIN. This is a computer-generated tax invoice and requires no physical signature under Indian Information Technology Act.'
  };
}

// GET /api/invoices - Admin invoice listing
router.get('/', protect, admin, async (req, res) => {
  try {
    const { search = '', status = 'all', dateRange = 'all' } = req.query;

    let ordersList = [];
    if (!global.USE_MONGODB) {
      ordersList = [...mockDb.orders];
    } else {
      ordersList = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    }

    let invoices = ordersList.map(o => {
      const inv = buildInvoiceData(o);
      return {
        _id: o._id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        orderNumber: inv.orderNumber,
        orderId: o._id,
        customerName: inv.customer.name,
        customerEmail: inv.customer.email,
        totalAmount: inv.pricing.totalAmount,
        paymentStatus: inv.paymentStatus,
        paymentMethod: inv.paymentMethod,
        orderStatus: inv.orderStatus
      };
    });

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      invoices = invoices.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.orderNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerEmail.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'all') {
      invoices = invoices.filter(inv => inv.paymentStatus.toLowerCase() === status.toLowerCase() || inv.orderStatus.toLowerCase() === status.toLowerCase());
    }

    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let days = 0;
      if (dateRange === 'today') days = 1;
      else if (dateRange === '7days') days = 7;
      else if (dateRange === '30days') days = 30;

      if (days > 0) {
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        invoices = invoices.filter(inv => new Date(inv.invoiceDate) >= cutoff);
      }
    }

    res.json({
      success: true,
      invoices,
      totalCount: invoices.length,
      stats: {
        totalInvoices: ordersList.length,
        totalBilled: ordersList.reduce((acc, o) => acc + (o.totalAmount || 0), 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/invoices/:id - Get full invoice data by orderId or invoiceNumber
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    let order;

    if (!global.USE_MONGODB) {
      order = mockDb.orders.find(o => 
        String(o._id) === String(id) || 
        o.orderNumber === id || 
        (o.invoiceNumber && o.invoiceNumber.toUpperCase() === id.toUpperCase())
      );
    } else {
      order = await Order.findById(id).populate('user', 'name email phone');
      if (!order) {
        order = await Order.findOne({
          $or: [{ orderNumber: id }, { invoiceNumber: id.toUpperCase() }]
        }).populate('user', 'name email phone');
      }
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Invoice / Order not found.' });
    }

    // Authorization check
    if (req.user.role !== 'ADMIN' && String(order.user?._id || order.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const invoice = buildInvoiceData(order);
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
