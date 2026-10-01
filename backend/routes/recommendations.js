const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const mockDb = require('../utils/mockDb');

// POST /api/recommendations
router.post('/', async (req, res) => {
  try {
    const { goal = 'muscle_gain', dietary = 'all', maxBudget } = req.body;

    let allProducts;
    if (!global.USE_MONGODB) {
      allProducts = [...mockDb.products];
    } else {
      allProducts = await Product.find({ isActive: true }).populate('category', 'name slug');
    }

    // Goal rules
    const goalRules = {
      muscle_gain: ['whey-protein', 'mass-gainers', 'creatine', 'bcaa-eaa'],
      fat_loss: ['whey-protein', 'plant-protein', 'bcaa-eaa', 'pre-workout'],
      endurance: ['bcaa-eaa', 'pre-workout', 'vitamins'],
      general_fitness: ['whey-protein', 'vitamins', 'creatine']
    };

    const targetSlugs = goalRules[goal] || goalRules.muscle_gain;

    let filtered = allProducts.filter(p => {
      const catSlug = p.category?.slug || '';
      if (!targetSlugs.includes(catSlug)) return false;
      if (dietary === 'vegan' && catSlug !== 'plant-protein') return false;
      if (maxBudget && p.basePrice > Number(maxBudget)) return false;
      return true;
    });

    if (filtered.length === 0) {
      filtered = allProducts.slice(0, 3);
    }

    const reasons = {
      'whey-protein': 'High protein bioavailability (27g) with DigeZyme® for rapid muscle protein synthesis.',
      'plant-protein': 'Clean vegan nutrition with complete amino acid profile and easy digestion.',
      'creatine': 'Clinically proven to elevate ATP production, strength output, and workout capacity.',
      'pre-workout': 'Sustained energy and increased nitric oxide blood flow for high-intensity training.',
      'mass-gainers': 'Balanced calorie-to-protein ratio designed for progressive muscular mass addition.',
      'bcaa-eaa': 'Prevents intra-workout muscle catabolism and accelerates post-session recovery.',
      'vitamins': 'Supports daily metabolic functions, immune response, and overall vitality.'
    };

    const recommendations = filtered.slice(0, 3).map(p => ({
      ...p,
      reason: reasons[p.category?.slug] || 'Matches your targeted athletic requirements.'
    }));

    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;