const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const mockDb = require('../utils/mockDb');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');
const { logAdminAction } = require('../utils/adminLogger');

// Initialize mockDb reviews if not present
function getMockReviews() {
  if (!mockDb.reviews) {
    mockDb.reviews = [
      { _id: 'rev_1', product: 'p_gold_whey', productName: '100% Gold Standard Whey Isolate', user: 'usr_demo', userName: 'John Doe', rating: 5, title: 'Amazing product!', body: 'Best whey protein I have ever tried. Mixes perfectly and tastes great.', status: 'approved', isApproved: true, createdAt: new Date(Date.now() - 5 * 86400000) },
      { _id: 'rev_2', product: 'p_whey_conc', productName: 'Premium Whey Concentrate 80%', user: 'usr_demo', userName: 'Jane Smith', rating: 4, title: 'Good value for money', body: 'Great protein with a nice taste. Slightly more foam than expected but excellent value.', status: 'approved', isApproved: true, createdAt: new Date(Date.now() - 3 * 86400000) },
      { _id: 'rev_3', product: 'p_creatine_mono', productName: 'Micronized Creatine Monohydrate', user: 'usr_demo', userName: 'Arjun Sharma', rating: 5, title: 'Pure creatine, no fillers', body: 'Dissolves instantly and no bloating at all. Will definitely reorder.', status: 'pending', isApproved: false, createdAt: new Date(Date.now() - 1 * 86400000) },
      { _id: 'rev_4', product: 'p_clean_plant', productName: 'Clean Plant Protein Blend', user: 'usr_demo', userName: 'Priya Nair', rating: 2, title: 'Too grainy for my taste', body: 'Not my cup of tea. Texture is grainy and the taste is not very pleasant.', status: 'pending', isApproved: false, createdAt: new Date(Date.now() - 2 * 86400000) },
      { _id: 'rev_5', product: 'p_gold_whey', productName: '100% Gold Standard Whey Isolate', user: 'usr_2', userName: 'Rahul Mehta', rating: 3, title: 'Average product', body: 'Nothing special. Expected more for the price.', status: 'hidden', isApproved: false, createdAt: new Date(Date.now() - 10 * 86400000) }
    ];
  }
  return mockDb.reviews;
}

// ── GET /api/reviews?productId=xxx ──────────────────────────────
// Public: get approved reviews for a product
router.get('/', async (req, res) => {
  try {
    if (!global.USE_MONGODB) {
      const reviews = getMockReviews();
      let filtered = reviews.filter(r => r.isApproved === true);
      if (req.query.productId) filtered = filtered.filter(r => r.product === req.query.productId);
      return res.json({ success: true, reviews: filtered });
    }
    const query = { isApproved: true };
    if (req.query.productId) query.product = req.query.productId;
    const reviews = await Review.find(query).populate('user', 'name').sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/reviews ──────────────────────────────────────────
// Customer: submit a review
router.post('/', protect, async (req, res) => {
  try {
    const { productId, rating, title, body } = req.body;

    if (!global.USE_MONGODB) {
      const reviews = getMockReviews();
      const existing = reviews.find(r => r.product === productId && r.user === req.user._id);
      if (existing) return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
      const product = mockDb.products.find(p => p._id === productId);
      const review = {
        _id: 'rev_' + Date.now(),
        product: productId,
        productName: product ? product.name : '',
        user: req.user._id,
        userName: req.user.name,
        rating: Number(rating),
        title,
        body,
        status: 'pending',
        isApproved: false,
        createdAt: new Date()
      };
      reviews.unshift(review);
      return res.status(201).json({ success: true, message: 'Review submitted! It will be visible after approval.', review });
    }

    const existing = await Review.findOne({ product: productId, user: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    const review = await Review.create({ product: productId, user: req.user._id, rating, title, body });
    const reviews = await Review.find({ product: productId, isApproved: true });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, { rating: Math.round(avgRating * 10) / 10, reviewCount: reviews.length });
    res.status(201).json({ success: true, message: 'Review submitted!', review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/reviews/admin ─────────────────────────────────────
// Admin: get all reviews with filters
router.get('/admin', protect, admin, async (req, res) => {
  try {
    if (!global.USE_MONGODB) {
      const reviews = getMockReviews();
      let filtered = [...reviews];
      if (req.query.status && req.query.status !== 'all') {
        filtered = filtered.filter(r => r.status === req.query.status);
      }
      if (req.query.rating) {
        filtered = filtered.filter(r => r.rating === Number(req.query.rating));
      }
      if (req.query.productId) {
        filtered = filtered.filter(r => r.product === req.query.productId);
      }
      return res.json({ success: true, reviews: filtered, total: filtered.length });
    }
    const query = {};
    if (req.query.status === 'approved') { query.isApproved = true; }
    else if (req.query.status === 'pending') { query.isApproved = false; }
    if (req.query.rating) query.rating = Number(req.query.rating);
    if (req.query.productId) query.product = req.query.productId;
    const reviews = await Review.find(query).populate('user', 'name email').populate('product', 'name slug').sort({ createdAt: -1 });
    res.json({ success: true, reviews, total: reviews.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── PUT /api/reviews/:id ──────────────────────────────────────
// Admin: approve / hide / update review
router.put('/:id', protect, admin, async (req, res) => {
  try {
    if (!global.USE_MONGODB) {
      const reviews = getMockReviews();
      const review = reviews.find(r => r._id === req.params.id);
      if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
      if (req.body.status !== undefined) {
        review.status = req.body.status;
        review.isApproved = review.status === 'approved';
      }
      if (req.body.adminNote !== undefined) review.adminNote = req.body.adminNote;
      logAdminAction(req.user, 'REVIEW_UPDATED', 'REVIEWS', `Review ${req.params.id} set to ${review.status}`, { reviewId: req.params.id, status: review.status });
      return res.json({ success: true, review });
    }
    const updateData = { ...req.body };
    if (updateData.status === 'approved') updateData.isApproved = true;
    else if (updateData.status === 'hidden' || updateData.status === 'pending') updateData.isApproved = false;
    const review = await Review.findByIdAndUpdate(req.params.id, updateData, { new: true });
    logAdminAction(req.user, 'REVIEW_UPDATED', 'REVIEWS', `Review ${req.params.id} updated`, { reviewId: req.params.id });
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── DELETE /api/reviews/:id ────────────────────────────────────
// Admin: delete review
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    if (!global.USE_MONGODB) {
      const reviews = getMockReviews();
      const idx = reviews.findIndex(r => r._id === req.params.id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Review not found.' });
      const [removed] = reviews.splice(idx, 1);
      logAdminAction(req.user, 'REVIEW_DELETED', 'REVIEWS', `Deleted review by ${removed.userName} on ${removed.productName}`, { reviewId: req.params.id });
      return res.json({ success: true, message: 'Review deleted.' });
    }
    const review = await Review.findByIdAndDelete(req.params.id);
    if (review) {
      const reviews = await Review.find({ product: review.product, isApproved: true });
      const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
      await Product.findByIdAndUpdate(review.product, { rating: Math.round(avgRating * 10) / 10, reviewCount: reviews.length });
    }
    logAdminAction(req.user, 'REVIEW_DELETED', 'REVIEWS', `Deleted review ${req.params.id}`, { reviewId: req.params.id });
    res.json({ success: true, message: 'Review deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/reviews/bulk-clear ───────────────────────────────
// Admin: Permanently clear reviews matching filters or selection
router.post('/bulk-clear', protect, admin, async (req, res) => {
  try {
    const { reviewIds, scope, status } = req.body;
    let deletedCount = 0;

    if (Array.isArray(reviewIds) && reviewIds.length > 0) {
      const idStrings = reviewIds.map(String);
      if (!global.USE_MONGODB) {
        const reviews = getMockReviews();
        const before = reviews.length;
        mockDb.reviews = reviews.filter(r => !idStrings.includes(String(r._id)));
        deletedCount = before - mockDb.reviews.length;
      } else {
        const resDel = await Review.deleteMany({ _id: { $in: reviewIds } });
        deletedCount = resDel.deletedCount || 0;
      }
    } else if (scope === 'all') {
      if (!global.USE_MONGODB) {
        deletedCount = (mockDb.reviews || []).length;
        mockDb.reviews = [];
      } else {
        const resDel = await Review.deleteMany({});
        deletedCount = resDel.deletedCount || 0;
      }
    } else {
      // Filter by status e.g. pending/hidden
      if (!global.USE_MONGODB) {
        const reviews = getMockReviews();
        const before = reviews.length;
        mockDb.reviews = reviews.filter(r => {
          if (status && status !== 'all') {
            const curStatus = r.status || (r.isApproved ? 'approved' : 'pending');
            return curStatus !== status;
          }
          return false;
        });
        deletedCount = before - mockDb.reviews.length;
      } else {
        const q = {};
        if (status && status !== 'all') {
          if (status === 'approved') q.isApproved = true;
          else if (status === 'pending' || status === 'hidden') q.isApproved = false;
        }
        const resDel = await Review.deleteMany(q);
        deletedCount = resDel.deletedCount || 0;
      }
    }

    logAdminAction(req.user, 'REVIEWS_BULK_CLEARED', 'REVIEWS', `Bulk cleared ${deletedCount} reviews`, { count: deletedCount, scope });
    res.json({ success: true, count: deletedCount, message: `Successfully cleared ${deletedCount} review(s).` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear reviews: ' + err.message });
  }
});

module.exports = router;