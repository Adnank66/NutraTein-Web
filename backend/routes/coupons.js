const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const mockDb = require('../utils/mockDb');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');
const { logAdminAction } = require('../utils/adminLogger');

// Helper to determine dynamic status
function getCouponStatus(coupon) {
  if (!coupon.isActive) return 'INACTIVE';
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return 'EXPIRED';
  return 'ACTIVE';
}

// POST /api/coupons/validate
router.post('/validate', async (req, res) => {
  try {
    const { code, orderTotal = 0, userId } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required.' });

    const cleanCode = code.trim().toUpperCase();
    let coupon;
    if (!global.USE_MONGODB) {
      coupon = mockDb.coupons.find(c => c.code.toUpperCase() === cleanCode);
    } else {
      coupon = await Coupon.findOne({ code: cleanCode });
    }

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code.' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: 'This coupon is currently inactive or deactivated.' });
    }

    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return res.status(400).json({ success: false, message: 'This coupon is not active yet.' });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      return res.status(400).json({ success: false, message: 'This coupon has expired.' });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon overall usage limit has been reached.' });
    }

    if (coupon.perCustomerLimit && userId && Array.isArray(coupon.usedBy)) {
      const userUsageCount = coupon.usedBy.filter(u => String(u) === String(userId)).length;
      if (userUsageCount >= coupon.perCustomerLimit) {
        return res.status(400).json({
          success: false,
          message: `You have reached the maximum allowed uses (${coupon.perCustomerLimit}) for this coupon.`
        });
      }
    }

    const numericTotal = Number(orderTotal) || 0;
    if (coupon.minOrderValue && numericTotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${coupon.minOrderValue.toLocaleString('en-IN')} required to apply this coupon.`
      });
    }

    let discount = coupon.discountType === 'PERCENT'
      ? Math.round((numericTotal * coupon.discountValue) / 100)
      : Number(coupon.discountValue);

    if (coupon.maxDiscount && coupon.maxDiscount > 0) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
    discount = Math.min(discount, numericTotal);

    res.json({
      success: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description,
        maxDiscount: coupon.maxDiscount,
        minOrderValue: coupon.minOrderValue
      },
      discountAmount: Math.round(discount)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/coupons (admin)
router.get('/', protect, admin, async (req, res) => {
  try {
    const { search = '', status = 'all' } = req.query;

    let couponsList = [];
    if (!global.USE_MONGODB) {
      couponsList = [...mockDb.coupons];
    } else {
      couponsList = await Coupon.find().sort({ createdAt: -1 });
    }

    // Attach dynamic computed status
    let enriched = couponsList.map(c => {
      const plain = c.toObject ? c.toObject() : { ...c };
      plain.computedStatus = getCouponStatus(plain);
      return plain;
    });

    // Filter by search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      enriched = enriched.filter(c => 
        (c.code && c.code.toLowerCase().includes(q)) || 
        (c.description && c.description.toLowerCase().includes(q))
      );
    }

    // Filter by status
    if (status && status !== 'all') {
      enriched = enriched.filter(c => c.computedStatus.toLowerCase() === status.toLowerCase());
    }

    // Aggregate stats
    const totalCoupons = couponsList.length;
    const activeCount = couponsList.filter(c => getCouponStatus(c) === 'ACTIVE').length;
    const expiredCount = couponsList.filter(c => getCouponStatus(c) === 'EXPIRED').length;
    const totalDiscountGenerated = couponsList.reduce((sum, c) => sum + (c.totalDiscountGenerated || 0), 0);

    res.json({
      success: true,
      coupons: enriched,
      stats: {
        totalCoupons,
        activeCount,
        expiredCount,
        totalDiscountGenerated
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/coupons (admin)
router.post('/', protect, admin, async (req, res) => {
  try {
    const {
      code,
      description = '',
      discountType = 'PERCENT',
      discountValue,
      minOrderValue = 0,
      maxDiscount = 0,
      usageLimit = null,
      perCustomerLimit = 1,
      startDate = new Date(),
      expiresAt = null,
      isActive = true
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }
    if (!discountValue || Number(discountValue) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid discount value is required.' });
    }

    const cleanCode = code.trim().toUpperCase();

    if (!global.USE_MONGODB) {
      const exists = mockDb.coupons.find(c => c.code.toUpperCase() === cleanCode);
      if (exists) {
        return res.status(400).json({ success: false, message: `Coupon code '${cleanCode}' already exists.` });
      }

      const newCoupon = {
        _id: 'cpn_' + Date.now(),
        code: cleanCode,
        description,
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: Number(minOrderValue) || 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        perCustomerLimit: Number(perCustomerLimit) || 1,
        startDate: startDate ? new Date(startDate) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: Boolean(isActive),
        usedCount: 0,
        totalDiscountGenerated: 0,
        usedBy: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockDb.coupons.unshift(newCoupon);

      await logAdminAction({
        action: 'COUPON_CREATE',
        module: 'COUPONS',
        description: `Created new coupon ${newCoupon.code} (${newCoupon.discountType === 'PERCENT' ? newCoupon.discountValue + '%' : '₹' + newCoupon.discountValue})`,
        adminId: req.user?._id || 'admin'
      });

      return res.status(201).json({ success: true, coupon: newCoupon });
    }

    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon code '${cleanCode}' already exists.` });
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      description,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      perCustomerLimit: Number(perCustomerLimit) || 1,
      startDate: startDate ? new Date(startDate) : new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: Boolean(isActive)
    });

    await logAdminAction({
      action: 'COUPON_CREATE',
      module: 'COUPONS',
      description: `Created new coupon ${coupon.code} (${coupon.discountType === 'PERCENT' ? coupon.discountValue + '%' : '₹' + coupon.discountValue})`,
      adminId: req.user?._id || 'admin'
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/coupons/:id (admin)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.code) updateData.code = updateData.code.trim().toUpperCase();

    if (!global.USE_MONGODB) {
      const idx = mockDb.coupons.findIndex(c => String(c._id) === String(id));
      if (idx === -1) return res.status(404).json({ success: false, message: 'Coupon not found.' });

      mockDb.coupons[idx] = {
        ...mockDb.coupons[idx],
        ...updateData,
        updatedAt: new Date()
      };

      await logAdminAction({
        action: 'COUPON_UPDATE',
        module: 'COUPONS',
        description: `Updated coupon details for ${mockDb.coupons[idx].code}`,
        adminId: req.user?._id || 'admin'
      });

      return res.json({ success: true, coupon: mockDb.coupons[idx] });
    }

    const coupon = await Coupon.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });

    await logAdminAction({
      action: 'COUPON_UPDATE',
      module: 'COUPONS',
      description: `Updated coupon details for ${coupon.code}`,
      adminId: req.user?._id || 'admin'
    });

    res.json({ success: true, coupon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/coupons/:id/toggle (admin)
router.put('/:id/toggle', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!global.USE_MONGODB) {
      const coupon = mockDb.coupons.find(c => String(c._id) === String(id));
      if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });

      coupon.isActive = !coupon.isActive;
      coupon.updatedAt = new Date();

      await logAdminAction({
        action: 'COUPON_TOGGLE',
        module: 'COUPONS',
        description: `${coupon.isActive ? 'Activated' : 'Deactivated'} coupon ${coupon.code}`,
        adminId: req.user?._id || 'admin'
      });

      return res.json({
        success: true,
        coupon,
        message: `Coupon ${coupon.code} is now ${coupon.isActive ? 'Active' : 'Inactive'}.`
      });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    await logAdminAction({
      action: 'COUPON_TOGGLE',
      module: 'COUPONS',
      description: `${coupon.isActive ? 'Activated' : 'Deactivated'} coupon ${coupon.code}`,
      adminId: req.user?._id || 'admin'
    });

    res.json({
      success: true,
      coupon,
      message: `Coupon ${coupon.code} is now ${coupon.isActive ? 'Active' : 'Inactive'}.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/coupons/:id (admin)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!global.USE_MONGODB) {
      const idx = mockDb.coupons.findIndex(c => String(c._id) === String(id));
      if (idx === -1) return res.status(404).json({ success: false, message: 'Coupon not found.' });

      const code = mockDb.coupons[idx].code;
      mockDb.coupons.splice(idx, 1);

      await logAdminAction({
        action: 'COUPON_DELETE',
        module: 'COUPONS',
        description: `Deleted coupon ${code}`,
        adminId: req.user?._id || 'admin'
      });

      return res.json({ success: true, message: `Coupon ${code} deleted successfully.` });
    }

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });

    await logAdminAction({
      action: 'COUPON_DELETE',
      module: 'COUPONS',
      description: `Deleted coupon ${coupon.code}`,
      adminId: req.user?._id || 'admin'
    });

    res.json({ success: true, message: `Coupon ${coupon.code} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/coupons/bulk-clear - Admin: Permanently clear coupons
router.post('/bulk-clear', protect, admin, async (req, res) => {
  try {
    const { couponIds, scope } = req.body;
    let deletedCount = 0;

    if (Array.isArray(couponIds) && couponIds.length > 0) {
      const idStrings = couponIds.map(String);
      if (!global.USE_MONGODB) {
        const before = mockDb.coupons.length;
        mockDb.coupons = mockDb.coupons.filter(c => !idStrings.includes(String(c._id)));
        deletedCount = before - mockDb.coupons.length;
      } else {
        const resDel = await Coupon.deleteMany({ _id: { $in: couponIds } });
        deletedCount = resDel.deletedCount || 0;
      }
    } else if (scope === 'all') {
      if (!global.USE_MONGODB) {
        deletedCount = mockDb.coupons.length;
        mockDb.coupons = [];
      } else {
        const resDel = await Coupon.deleteMany({});
        deletedCount = resDel.deletedCount || 0;
      }
    } else if (scope === 'expired') {
      const now = new Date();
      if (!global.USE_MONGODB) {
        const before = mockDb.coupons.length;
        mockDb.coupons = mockDb.coupons.filter(c => !c.expiresAt || new Date(c.expiresAt) >= now);
        deletedCount = before - mockDb.coupons.length;
      } else {
        const resDel = await Coupon.deleteMany({ expiresAt: { $lt: now } });
        deletedCount = resDel.deletedCount || 0;
      }
    }

    await logAdminAction({
      action: 'COUPONS_BULK_CLEARED',
      module: 'COUPONS',
      description: `Bulk cleared ${deletedCount} coupons (scope: ${scope || 'selected'})`,
      adminId: req.user?._id || 'admin'
    });

    res.json({ success: true, count: deletedCount, message: `Successfully cleared ${deletedCount} coupon(s).` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear coupons: ' + err.message });
  }
});

module.exports = router;
