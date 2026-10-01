const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Banner = require('../models/Banner');
const Order = require('../models/Order');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/proteinx';

const categories = [
  { name: 'Whey Protein', slug: 'whey-protein', icon: 'W', sortOrder: 1, image: '/assets/products/shred-whey.jpg' },
  { name: 'Plant Protein', slug: 'plant-protein', icon: 'P', sortOrder: 2, image: '/assets/products/plant-protein.jpg' },
  { name: 'Mass Gainers', slug: 'mass-gainers', icon: 'M', sortOrder: 3, image: '/assets/products/mass-gainer.jpg' },
  { name: 'Creatine', slug: 'creatine', icon: 'C', sortOrder: 4, image: '/assets/products/creatine.jpg' },
  { name: 'Pre-Workout', slug: 'pre-workout', icon: 'E', sortOrder: 5, image: '/assets/products/pre-workout.jpg' },
  { name: 'BCAA / EAA', slug: 'bcaa-eaa', icon: 'B', sortOrder: 6, image: '/assets/products/bcaa.jpg' },
  { name: 'Vitamins', slug: 'vitamins', icon: 'V', sortOrder: 7, image: '/assets/products/vitamins.jpg' },
  { name: 'Accessories', slug: 'accessories', icon: 'A', sortOrder: 8, image: '/assets/products/shaker.jpg' },
];

const img = (url) => [{ url, alt: 'Product Image', isPrimary: true, sortOrder: 0 }];

const products = (cats) => {
  const c = {};
  cats.forEach(cat => c[cat.slug] = cat._id);
  return [
  // WHEY PROTEINS
  { name: '100% Gold Standard Whey Isolate', slug: 'gold-whey-isolate', brand: 'NUTRATEIN', category: c['whey-protein'],
    description: 'Ultra-pure cross-flow microfiltered whey isolate with DigeZyme enzyme complex for maximum absorption and minimal bloating.',
    shortDescription: 'Ultra-pure whey isolate with 27g protein per scoop.',
    images: img('/assets/products/whey.jpg'),
    variants: [
      { flavor: 'Chocolate', size: '1 kg', sku: 'GWI-CHO-1KG', price: 2999, stock: 80 },
      { flavor: 'Vanilla', size: '1 kg', sku: 'GWI-VAN-1KG', price: 2999, stock: 60 },
      { flavor: 'Chocolate', size: '2 kg', sku: 'GWI-CHO-2KG', price: 5499, stock: 45 },
      { flavor: 'Strawberry', size: '1 kg', sku: 'GWI-STR-1KG', price: 2999, stock: 35 },
    ],
    basePrice: 2999, mrp: 3999, discountPercent: 25,
    rating: 4.8, reviewCount: 248, isBestSeller: true,
    nutrition: { servingSize: '30g', calories: 115, protein: 27, carbohydrates: 1, fat: 0.5, bcaa: '6.2g', digestiveEnzymes: 'DigeZyme®' },
    tags: ['whey', 'isolate', 'lean muscle', 'bestseller'], viewCount: 1240 },

  { name: 'Premium Whey Concentrate 80%', slug: 'whey-concentrate-80', brand: 'NUTRATEIN', category: c['whey-protein'],
    description: 'High-quality whey concentrate delivering 24g of protein per serving. Perfect for daily supplementation with great taste.',
    shortDescription: '24g protein per serving, excellent value.',
    images: img('/assets/products/shred-whey.jpg'),
    variants: [
      { flavor: 'Double Chocolate', size: '1 kg', sku: 'WC80-DCH-1KG', price: 1799, stock: 120 },
      { flavor: 'Cookies & Cream', size: '1 kg', sku: 'WC80-CC-1KG', price: 1799, stock: 90 },
      { flavor: 'Double Chocolate', size: '2 kg', sku: 'WC80-DCH-2KG', price: 3299, stock: 55 },
    ],
    basePrice: 1799, mrp: 2499, discountPercent: 28,
    rating: 4.6, reviewCount: 180, isBestSeller: false, isNew: false,
    tags: ['whey', 'concentrate', 'value'], viewCount: 860 },

  { name: 'Hydro Whey Pro — Hydrolyzed', slug: 'hydro-whey-pro', brand: 'NUTRATEIN', category: c['whey-protein'],
    description: 'Pre-digested hydrolyzed whey for ultra-rapid absorption. Zero lactose, zero sugar. Ideal post-workout recovery formula.',
    shortDescription: 'Zero lactose, ultra-fast absorbing hydrolyzed whey.',
    images: img('/assets/products/whey.jpg'),
    variants: [
      { flavor: 'Unflavored', size: '1 kg', sku: 'HWP-UNF-1KG', price: 3799, stock: 40 },
      { flavor: 'Chocolate', size: '1 kg', sku: 'HWP-CHO-1KG', price: 3999, stock: 30 },
    ],
    basePrice: 3799, mrp: 4999, discountPercent: 24, isNew: true,
    rating: 4.7, reviewCount: 62,
    tags: ['hydrolyzed', 'fast absorption', 'lactose free'], viewCount: 420 },

  // PLANT PROTEINS
  { name: 'Clean Plant Protein Blend', slug: 'clean-plant-protein', brand: 'NUTRATEIN', category: c['plant-protein'],
    description: 'Smooth blend of pea and brown rice protein. Complete amino acid profile, certified vegan, zero artificial sweeteners.',
    shortDescription: 'Smooth pea + brown rice blend. 25g protein.',
    images: img('/assets/products/plant-protein.jpg'),
    variants: [
      { flavor: 'Vanilla', size: '1 kg', sku: 'CPP-VAN-1KG', price: 2499, stock: 70 },
      { flavor: 'Chocolate', size: '1 kg', sku: 'CPP-CHO-1KG', price: 2499, stock: 55 },
      { flavor: 'Unflavored', size: '1 kg', sku: 'CPP-UNF-1KG', price: 2299, stock: 40 },
    ],
    basePrice: 2499, mrp: 3299, discountPercent: 24,
    rating: 4.5, reviewCount: 134, isBestSeller: false,
    nutrition: { servingSize: '30g', calories: 125, protein: 25, carbohydrates: 2, fat: 1.5 },
    tags: ['vegan', 'plant protein', 'pea protein', 'dairy free'], viewCount: 680 },

  { name: 'Pea Protein Isolate — Organic', slug: 'pea-protein-isolate', brand: 'NUTRATEIN', category: c['plant-protein'],
    description: 'Organic yellow pea protein isolate. Hypoallergenic, easily digestible, high leucine content for muscle synthesis.',
    shortDescription: 'Organic pea isolate, hypoallergenic and vegan.',
    images: img('/assets/products/plant-protein.jpg'),
    variants: [
      { flavor: 'Natural', size: '1 kg', sku: 'PPI-NAT-1KG', price: 1999, stock: 50 },
      { flavor: 'Vanilla', size: '1 kg', sku: 'PPI-VAN-1KG', price: 2099, stock: 35 },
    ],
    basePrice: 1999, mrp: 2799, discountPercent: 29, isNew: true,
    rating: 4.4, reviewCount: 48,
    tags: ['organic', 'pea protein', 'vegan', 'hypoallergenic'], viewCount: 340 },

  // MASS GAINERS
  { name: 'Extreme Mass Gainer 3kg', slug: 'extreme-mass-gainer', brand: 'NUTRATEIN', category: c['mass-gainers'],
    description: 'High-calorie mass gainer with 50g protein and complex carbohydrates per serving. Designed for serious bulking.',
    shortDescription: '450 calories and 50g protein per serving.',
    images: img('/assets/products/mass-gainer.jpg'),
    variants: [
      { flavor: 'Chocolate', size: '3 kg', sku: 'EMG-CHO-3KG', price: 2999, stock: 60 },
      { flavor: 'Vanilla', size: '3 kg', sku: 'EMG-VAN-3KG', price: 2999, stock: 45 },
      { flavor: 'Strawberry', size: '6 kg', sku: 'EMG-STR-6KG', price: 5499, stock: 25 },
    ],
    basePrice: 2999, mrp: 3999, discountPercent: 25,
    rating: 4.6, reviewCount: 98, isBestSeller: true,
    nutrition: { servingSize: '150g', calories: 450, protein: 50, carbohydrates: 68, fat: 5 },
    tags: ['mass gainer', 'bulk', 'high calorie', 'weight gain'], viewCount: 920 },

  { name: 'Lean Mass Gainer 2kg', slug: 'lean-mass-gainer', brand: 'NUTRATEIN', category: c['mass-gainers'],
    description: 'Lean muscle mass formula with balanced macros. Lower fat content than traditional gainers, ideal for clean bulk.',
    shortDescription: 'Clean bulk formula with 40g protein and controlled fat.',
    images: img('/assets/products/mass-gainer.jpg'),
    variants: [
      { flavor: 'Chocolate', size: '2 kg', sku: 'LMG-CHO-2KG', price: 2299, stock: 55 },
      { flavor: 'Vanilla', size: '2 kg', sku: 'LMG-VAN-2KG', price: 2299, stock: 40 },
    ],
    basePrice: 2299, mrp: 3199, discountPercent: 28,
    rating: 4.4, reviewCount: 67,
    tags: ['lean mass', 'clean bulk'], viewCount: 560 },

  // CREATINE
  { name: 'CreaCore Creatine Monohydrate', slug: 'creatine-monohydrate', brand: 'NUTRATEIN', category: c['creatine'],
    description: 'THE ULTIMATE FUEL FOR MUSCLE GROWTH. Ultra-fine micronized creatine monohydrate. 5g per serving for maximum strength, power, and muscle volumization.',
    shortDescription: 'THE ULTIMATE FUEL FOR MUSCLE GROWTH. 100% pure micronized creatine.',
    images: img('/assets/products/creatine.jpg'),
    variants: [
      { flavor: 'Unflavoured', size: '100g', weight: '100g', servings: 32, sku: 'NUT-CRM-100G', price: 549, originalPrice: 699, mrp: 699, discount: 21, stock: 150, status: 'in_stock', isDefault: true },
      { flavor: 'Unflavoured', size: '250g', weight: '250g', servings: 80, sku: 'NUT-CRM-250G', price: 1199, originalPrice: 1499, mrp: 1499, discount: 20, stock: 90, status: 'in_stock', isDefault: false },
    ],
    basePrice: 549, mrp: 699, discountPercent: 21,
    rating: 4.9, reviewCount: 312, isBestSeller: true,
    nutrition: { servingSize: '5g', calories: 0, protein: 0, carbohydrates: 0, fat: 0 },
    tags: ['creatine', 'strength', 'power', 'monohydrate'], viewCount: 1580 },

  { name: 'Creatine HCL — pH Buffered', slug: 'creatine-hcl', brand: 'NUTRATEIN', category: c['creatine'],
    description: 'Creatine hydrochloride — requires no loading phase, better water solubility, minimal bloating.',
    shortDescription: 'No loading phase, superior solubility.',
    images: img('/assets/products/creatine.jpg'),
    variants: [
      { flavor: 'Unflavored', size: '100g', sku: 'CHCL-UNF-100G', price: 1299, stock: 65 },
      { flavor: 'Fruit Punch', size: '100g', sku: 'CHCL-FP-100G', price: 1399, stock: 40 },
    ],
    basePrice: 1299, mrp: 1899, discountPercent: 32, isNew: true,
    rating: 4.6, reviewCount: 45,
    tags: ['creatine hcl', 'no bloat', 'strength'], viewCount: 380 },

  // PRE-WORKOUT
  { name: 'Ignition Pre-Workout Max', slug: 'ignition-pre-workout', brand: 'NUTRATEIN', category: c['pre-workout'],
    description: 'Powerful pre-workout with 300mg caffeine, beta-alanine, citrulline malate, and BetaPower betaine. 30 intense servings.',
    shortDescription: '300mg caffeine, full-dose ingredients. 30 servings.',
    images: img('/assets/products/pre-workout.jpg'),
    variants: [
      { flavor: 'Watermelon', size: '300g (30 servings)', sku: 'IPW-WM-300G', price: 1799, stock: 80 },
      { flavor: 'Blue Raspberry', size: '300g (30 servings)', sku: 'IPW-BR-300G', price: 1799, stock: 65 },
      { flavor: 'Citrus Burst', size: '300g (30 servings)', sku: 'IPW-CB-300G', price: 1799, stock: 50 },
    ],
    basePrice: 1799, mrp: 2499, discountPercent: 28,
    rating: 4.7, reviewCount: 156, isBestSeller: true,
    nutrition: { servingSize: '10g', calories: 10, protein: 0, carbohydrates: 2, fat: 0 },
    tags: ['pre-workout', 'energy', 'pump', 'caffeine', 'performance'], viewCount: 1100 },

  { name: 'Stim-Free Pre-Workout Pump', slug: 'stim-free-pre-workout', brand: 'NUTRATEIN', category: c['pre-workout'],
    description: 'Caffeine-free pre-workout with L-Citrulline, Norvaline, and HydroMax glycerol for incredible muscle pumps without stimulants.',
    shortDescription: 'Zero caffeine pump formula. Train any time of day.',
    images: img('/assets/products/pre-workout.jpg'),
    variants: [
      { flavor: 'Grape', size: '300g (30 servings)', sku: 'SFP-GR-300G', price: 1599, stock: 55 },
      { flavor: 'Peach Mango', size: '300g (30 servings)', sku: 'SFP-PM-300G', price: 1599, stock: 40 },
    ],
    basePrice: 1599, mrp: 2199, discountPercent: 27, isNew: true,
    rating: 4.5, reviewCount: 48,
    tags: ['stim-free', 'pump', 'caffeine-free', 'pre-workout'], viewCount: 420 },

  // BCAA / EAA
  { name: 'BCAA 2:1:1 Intra-Fuel', slug: 'bcaa-211-intra-fuel', brand: 'NUTRATEIN', category: c['bcaa-eaa'],
    description: 'Science-backed 2:1:1 ratio of leucine, isoleucine, and valine with electrolytes for intra-workout recovery and muscle retention.',
    shortDescription: '6g BCAA 2:1:1 + electrolytes. 30 servings.',
    images: img('/assets/products/bcaa.jpg'),
    variants: [
      { flavor: 'Watermelon', size: '300g (30 servings)', sku: 'BCA-WM-300G', price: 1199, stock: 95 },
      { flavor: 'Mango', size: '300g (30 servings)', sku: 'BCA-MN-300G', price: 1199, stock: 75 },
      { flavor: 'Green Apple', size: '300g (30 servings)', sku: 'BCA-GA-300G', price: 1199, stock: 60 },
    ],
    basePrice: 1199, mrp: 1699, discountPercent: 29,
    rating: 4.6, reviewCount: 128, isBestSeller: false,
    tags: ['bcaa', 'recovery', 'muscle retention', 'intra workout'], viewCount: 720 },

  { name: 'EAA Complete — All 9 Essential Amino Acids', slug: 'eaa-complete', brand: 'NUTRATEIN', category: c['bcaa-eaa'],
    description: 'Full spectrum of all 9 essential amino acids including the 3 BCAAs. Superior to standalone BCAA for complete muscle protein synthesis.',
    shortDescription: 'All 9 EAAs including BCAAs. 10g per serving.',
    images: img('/assets/products/bcaa.jpg'),
    variants: [
      { flavor: 'Tropical', size: '300g (30 servings)', sku: 'EAA-TRP-300G', price: 1499, stock: 65 },
      { flavor: 'Berry Blast', size: '300g (30 servings)', sku: 'EAA-BB-300G', price: 1499, stock: 50 },
    ],
    basePrice: 1499, mrp: 2099, discountPercent: 29, isNew: true,
    rating: 4.7, reviewCount: 56,
    tags: ['eaa', 'amino acids', 'recovery', 'muscle synthesis'], viewCount: 480 },

  // VITAMINS
  { name: 'Daily Multivitamin Active Formula', slug: 'multivitamin-active', brand: 'NUTRATEIN', category: c['vitamins'],
    description: 'Complete sports multivitamin with 23 vitamins and minerals, antioxidants, and herbal extracts. Designed for active individuals.',
    shortDescription: '23 vitamins & minerals for active lifestyles. 60 tabs.',
    images: img('/assets/products/vitamins.jpg'),
    variants: [
      { flavor: 'N/A', size: '60 Tablets', sku: 'MVA-60T', price: 699, stock: 200 },
      { flavor: 'N/A', size: '120 Tablets', sku: 'MVA-120T', price: 1199, stock: 130 },
    ],
    basePrice: 699, mrp: 999, discountPercent: 30,
    rating: 4.5, reviewCount: 89,
    tags: ['multivitamin', 'vitamins', 'minerals', 'health'], viewCount: 590 },

  { name: 'Vitamin D3 + K2 5000 IU', slug: 'vitamin-d3-k2', brand: 'NUTRATEIN', category: c['vitamins'],
    description: 'Vitamin D3 with K2 cofactor for optimal calcium absorption, immune function, and bone density. Cholecalciferol (D3) form.',
    shortDescription: 'D3 + K2 for immunity and bone health. 60 softgels.',
    images: img('/assets/products/vitamins.jpg'),
    variants: [{ flavor: 'N/A', size: '60 Softgels', sku: 'VD3K2-60SG', price: 599, stock: 180 }],
    basePrice: 599, mrp: 899, discountPercent: 33, isNew: true,
    rating: 4.8, reviewCount: 44,
    tags: ['vitamin d3', 'k2', 'immunity', 'bone health'], viewCount: 340 },

  { name: 'Omega-3 Fish Oil Triple Strength', slug: 'omega-3-fish-oil', brand: 'NUTRATEIN', category: c['vitamins'],
    description: 'Triple strength fish oil with 1500mg EPA+DHA per serving. Heart health, joint support, and cognitive function.',
    shortDescription: '1500mg EPA+DHA. Heart and joint support.',
    images: img('/assets/products/vitamins.jpg'),
    variants: [{ flavor: 'N/A', size: '60 Softgels', sku: 'OMG3-60SG', price: 899, stock: 150 }],
    basePrice: 899, mrp: 1299, discountPercent: 31,
    rating: 4.7, reviewCount: 76,
    tags: ['omega 3', 'fish oil', 'heart health', 'joints'], viewCount: 480 },

  { name: 'Zinc + Magnesium + B6 (ZMA)', slug: 'zma-formula', brand: 'NUTRATEIN', category: c['vitamins'],
    description: 'ZMA sleep and recovery formula. Supports testosterone levels, deep sleep quality, and overnight muscle recovery.',
    shortDescription: 'Sleep, recovery, and hormone support. 90 caps.',
    images: img('/assets/products/vitamins.jpg'),
    variants: [{ flavor: 'N/A', size: '90 Capsules', sku: 'ZMA-90C', price: 799, stock: 100 }],
    basePrice: 799, mrp: 1199, discountPercent: 33,
    rating: 4.6, reviewCount: 54,
    tags: ['zma', 'sleep', 'recovery', 'zinc magnesium'], viewCount: 390 },

  // ACCESSORIES
  { name: 'Pro Shaker 700ml — Matte Black', slug: 'pro-shaker-700ml', brand: 'NUTRATEIN', category: c['accessories'],
    description: 'BPA-free protein shaker with stainless steel mixing ball. Leak-proof, dishwasher-safe, and ergonomic handle.',
    shortDescription: 'BPA-free, leak-proof, dishwasher safe.',
    images: img('/assets/products/shaker.jpg'),
    variants: [
      { flavor: 'Matte Black', size: '700ml', sku: 'SHK-BLK-700', price: 499, stock: 200 },
      { flavor: 'Matte White', size: '700ml', sku: 'SHK-WHT-700', price: 499, stock: 180 },
      { flavor: 'Navy Blue', size: '700ml', sku: 'SHK-NBL-700', price: 499, stock: 150 },
    ],
    basePrice: 499, mrp: 799, discountPercent: 38,
    rating: 4.4, reviewCount: 167, isBestSeller: true,
    tags: ['shaker', 'bottle', 'accessories', 'bpa free'], viewCount: 980 },

  { name: 'Gym Lifting Gloves — Pro Grip', slug: 'gym-lifting-gloves', brand: 'NUTRATEIN', category: c['accessories'],
    description: 'Premium padded gym gloves with wrist wrap support. Full-palm silicone grip pattern. Sweat-wicking fabric.',
    shortDescription: 'Padded gloves with wrist support. S/M/L sizes.',
    images: img('/assets/products/shaker.jpg'),
    variants: [
      { flavor: 'Black', size: 'Small', sku: 'GLV-BLK-S', price: 699, stock: 80 },
      { flavor: 'Black', size: 'Medium', sku: 'GLV-BLK-M', price: 699, stock: 100 },
      { flavor: 'Black', size: 'Large', sku: 'GLV-BLK-L', price: 699, stock: 70 },
    ],
    basePrice: 699, mrp: 999, discountPercent: 30,
    rating: 4.3, reviewCount: 89,
    tags: ['gloves', 'lifting', 'gym accessories', 'grip'], viewCount: 560 },

  { name: 'Pill Organizer Weekly — 7 Day', slug: 'pill-organizer-weekly', brand: 'NUTRATEIN', category: c['accessories'],
    description: 'Premium 7-day pill and supplement organizer with large compartments. BPA-free, secure snap-lock lid.',
    shortDescription: '7-day supplement organizer. Snap-lock lid.',
    images: img('/assets/products/shaker.jpg'),
    variants: [{ flavor: 'Clear', size: 'Standard', sku: 'PLO-CLR-STD', price: 299, stock: 250 }],
    basePrice: 299, mrp: 499, discountPercent: 40,
    rating: 4.2, reviewCount: 45,
    tags: ['organizer', 'supplements', 'accessories'], viewCount: 280 },

  // ADDITIONAL PRODUCTS
  { name: 'Isolate Night Recovery Protein', slug: 'night-recovery-protein', brand: 'NUTRATEIN', category: c['whey-protein'],
    description: 'Slow-release casein + whey blend for overnight muscle recovery. 8-hour sustained amino acid release.',
    shortDescription: 'Slow-release night formula for overnight recovery.',
    images: img('/assets/products/whey.jpg'),
    variants: [
      { flavor: 'Chocolate Brownie', size: '1 kg', sku: 'NRP-CHB-1KG', price: 2799, stock: 55 },
      { flavor: 'Vanilla Cream', size: '1 kg', sku: 'NRP-VNC-1KG', price: 2799, stock: 40 },
    ],
    basePrice: 2799, mrp: 3799, discountPercent: 26,
    rating: 4.6, reviewCount: 72,
    tags: ['casein', 'night protein', 'slow release', 'recovery'], viewCount: 490 },

  { name: 'Clear Whey Isolate — Juice-Style', slug: 'clear-whey-isolate', brand: 'NUTRATEIN', category: c['whey-protein'],
    description: 'Revolutionary clear whey isolate that tastes like fruit juice, not a milky shake. Light, refreshing, 20g protein.',
    shortDescription: 'Juice-like texture, 20g protein. Light and refreshing.',
    images: img('/assets/products/shred-whey.jpg'),
    variants: [
      { flavor: 'Lemon Lime', size: '500g', sku: 'CWI-LL-500G', price: 2199, stock: 60 },
      { flavor: 'Pink Lemonade', size: '500g', sku: 'CWI-PL-500G', price: 2199, stock: 45 },
    ],
    basePrice: 2199, mrp: 2999, discountPercent: 27, isNew: true,
    rating: 4.8, reviewCount: 38,
    tags: ['clear whey', 'juice style', 'refreshing', 'isolate'], viewCount: 620 },

  { name: 'Pre-Workout Energy Shot — 12 Pack', slug: 'pre-workout-energy-shot', brand: 'NUTRATEIN', category: c['pre-workout'],
    description: 'Convenient ready-to-drink pre-workout shots. 150mg caffeine, B-vitamins, and amino acids per 60ml shot.',
    shortDescription: '60ml liquid shot. 150mg caffeine. No mixing.',
    images: img('/assets/products/pre-workout.jpg'),
    variants: [
      { flavor: 'Cherry Cola', size: '12 x 60ml', sku: 'PWS-CC-12PK', price: 999, stock: 80 },
      { flavor: 'Orange', size: '12 x 60ml', sku: 'PWS-OR-12PK', price: 999, stock: 65 },
    ],
    basePrice: 999, mrp: 1499, discountPercent: 33,
    rating: 4.4, reviewCount: 52,
    tags: ['energy shot', 'ready to drink', 'caffeine', 'pre-workout'], viewCount: 450 },

  { name: 'Collagen Peptides + Vitamin C', slug: 'collagen-peptides', brand: 'NUTRATEIN', category: c['vitamins'],
    description: 'Hydrolyzed collagen peptides with vitamin C for joint health, skin elasticity, and connective tissue repair.',
    shortDescription: 'Collagen + Vitamin C for joints and skin. 30 servings.',
    images: img('/assets/products/vitamins.jpg'),
    variants: [
      { flavor: 'Mixed Berry', size: '300g', sku: 'COL-MB-300G', price: 1299, stock: 70 },
      { flavor: 'Unflavored', size: '300g', sku: 'COL-UNF-300G', price: 1199, stock: 55 },
    ],
    basePrice: 1299, mrp: 1799, discountPercent: 28, isNew: true,
    rating: 4.5, reviewCount: 38,
    tags: ['collagen', 'joint health', 'skin', 'vitamin c'], viewCount: 310 },
  ];
};

const coupons = [
  { code: 'FIRST10', description: '10% off for first-time customers', discountType: 'PERCENT', discountValue: 10, minOrderValue: 500, usageLimit: 1000, isActive: true },
  { code: 'SAVE20', description: '20% off on orders above ₹2000', discountType: 'PERCENT', discountValue: 20, minOrderValue: 2000, maxDiscount: 500, usageLimit: 500, isActive: true },
  { code: 'FLAT300', description: 'Flat ₹300 off on orders above ₹1500', discountType: 'FIXED', discountValue: 300, minOrderValue: 1500, usageLimit: 300, isActive: true },
  { code: 'STACK15', description: '15% off on combo/stack orders', discountType: 'PERCENT', discountValue: 15, minOrderValue: 1000, maxDiscount: 400, usageLimit: 200, isActive: true },
  { code: 'WELCOME', description: 'Welcome coupon - ₹100 off', discountType: 'FIXED', discountValue: 100, minOrderValue: 0, usageLimit: 5000, isActive: true },
];

const banners = [
  { title: 'FUEL YOUR FITNESS', subtitle: 'Premium Protein Supplements', description: 'Premium nutrition designed for your goals. Science-backed formulas trusted by 50,000+ athletes.', buttonText: 'Shop Now', buttonLink: 'shop.html', badge: 'UP TO 30% OFF', position: 0, isActive: true, theme: 'dark', image: '/assets/products/pre-workout.jpg' },
  { title: 'UP TO 30% OFF', subtitle: 'Limited Time Offer', description: 'Huge discounts on selected whey, creatine and pre-workout products. Don\'t miss out.', buttonText: 'Explore Deals', buttonLink: 'shop.html?sale=true', badge: 'LIMITED TIME', position: 1, isActive: true, theme: 'dark', image: '/assets/products/bcaa.jpg' },
  { title: 'BUILD YOUR STACK', subtitle: 'Custom Supplement Bundles', description: 'Mix and match your perfect supplement stack and save 15% on every bundle you create.', buttonText: 'Build Your Stack', buttonLink: 'build-stack.html', badge: '15% BUNDLE SAVINGS', position: 2, isActive: true, theme: 'dark', image: '/assets/products/shred-whey.jpg' },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Review.deleteMany({}),
      Coupon.deleteMany({}),
      Banner.deleteMany({}),
      Order.deleteMany({})
    ]);

    // Create categories
    console.log('Creating categories...');
    const createdCats = await Category.insertMany(categories);

    // Create products
    console.log('Creating products...');
    const productData = products(createdCats);
    const createdProducts = await Product.insertMany(productData);
    console.log(`Created ${createdProducts.length} products`);

    // Create admin user
    console.log('Creating users...');
    const adminUser = await User.create({
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@proteinx.in',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
      phone: '+91 98765 43210'
    });

    const demoUser = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'User@123',
      role: 'user',
      phone: '+91 87654 32100',
      addresses: [{
        name: 'John Doe',
        phone: '+91 87654 32100',
        houseFlat: '204, Sunshine Apartments',
        street: 'MG Road',
        area: 'Andheri West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400053',
        isDefault: true
      }]
    });

    // Create sample reviews
    console.log('Creating reviews...');
    const reviewData = [];
    const reviewTexts = [
      { title: 'Excellent product!', body: 'Amazing quality and taste. Mixes perfectly without any clumping. Will definitely buy again.', rating: 5 },
      { title: 'Great value for money', body: 'Decent protein content and the taste is really good. Fast delivery too. Recommended!', rating: 4 },
      { title: 'Best protein I have tried', body: 'No digestive issues at all. Smooth texture and natural sweetness. Impressive quality.', rating: 5 },
    ];

    for (let i = 0; i < Math.min(6, createdProducts.length); i++) {
      const rev = reviewTexts[i % reviewTexts.length];
      reviewData.push({
        product: createdProducts[i]._id,
        user: demoUser._id,
        rating: rev.rating,
        title: rev.title,
        body: rev.body,
        isVerifiedPurchase: true,
        isApproved: true
      });
    }
    await Review.insertMany(reviewData);

    // Create coupons
    console.log('Creating coupons...');
    await Coupon.insertMany(coupons);

    // Create banners
    console.log('Creating banners...');
    await Banner.insertMany(banners);

    // Create sample order
    const sampleOrder = await Order.create({
      user: demoUser._id,
      items: [{
        product: createdProducts[0]._id,
        productName: createdProducts[0].name,
        productImage: createdProducts[0].images[0].url,
        flavor: 'Chocolate',
        size: '1 kg',
        quantity: 2,
        price: createdProducts[0].basePrice
      }],
      shippingAddress: demoUser.addresses[0],
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      subtotal: createdProducts[0].basePrice * 2,
      totalAmount: createdProducts[0].basePrice * 2,
      shippingAmount: 0,
      status: 'CONFIRMED',
      tracking: [
        { status: 'PLACED', message: 'Order placed successfully.' },
        { status: 'CONFIRMED', message: 'Order confirmed by seller.' }
      ],
      estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
    });

    console.log('\n=== SEED COMPLETE ===');
    console.log(`Categories: ${createdCats.length}`);
    console.log(`Products: ${createdProducts.length}`);
    console.log(`Reviews: ${reviewData.length}`);
    console.log(`Coupons: ${coupons.length}`);
    console.log(`Banners: ${banners.length}`);
    console.log(`Sample Orders: 1`);
    console.log('\nAdmin Login: admin@proteinx.in / Admin@123');
    console.log('Demo User: john@example.com / User@123');
    console.log('\nAvailable Coupons: FIRST10, SAVE20, FLAT300, STACK15, WELCOME');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();