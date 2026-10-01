const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/wishlist
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist', 'name slug images basePrice mrp discountPercent rating brand');
    res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/wishlist/toggle
router.post('/toggle', protect, async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user._id);
    const idx = user.wishlist.findIndex(id => id.toString() === productId);

    if (idx === -1) {
      user.wishlist.push(productId);
    } else {
      user.wishlist.splice(idx, 1);
    }
    await user.save();

    const added = idx === -1;
    res.json({ success: true, added, message: added ? 'Added to wishlist.' : 'Removed from wishlist.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: req.params.productId } });
    res.json({ success: true, message: 'Removed from wishlist.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;