const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const mockDb = require('../utils/mockDb');

router.get('/', async (req, res) => {
  try {
    if (!global.USE_MONGODB) {
      return res.json({ success: true, categories: mockDb.categories });
    }
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;