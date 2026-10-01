const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Cart is managed client-side in localStorage for guests
// and synced to server for logged-in users via user doc

// GET /api/cart - return server-side cart for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user._id).select('cart');
    res.json({ success: true, cart: user.cart || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;