const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const mockDb = require('../utils/mockDb');
const { protect, optionalAuth } = require('../middleware/auth');
const admin = require('../middleware/admin');
const { logAdminAction } = require('../utils/adminLogger');

// Product image uploads setup
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const productImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'prod-' + uniqueSuffix + ext);
  }
});

const productImageUpload = multer({
  storage: productImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (/jpeg|jpg|png|webp|gif|svg|avif/.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

// Clean local product image upload setup saving to public/assets/products/
const publicAssetsProductsDir = path.join(__dirname, '../../public/assets/products');
if (!fs.existsSync(publicAssetsProductsDir)) {
  fs.mkdirSync(publicAssetsProductsDir, { recursive: true });
}

const cleanProductImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, publicAssetsProductsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const prodName = (req.body && req.body.productName) || (req.query && req.query.productName) || path.basename(file.originalname, ext);
    let slug = String(prodName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!slug) slug = 'product';
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const filename = `${slug}-${randSuffix}${ext}`;
    cb(null, filename);
  }
});

const cleanImageUpload = multer({
  storage: cleanProductImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (/jpeg|jpg|png|webp|gif|svg|avif/.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

// POST /api/products/upload-image - Upload local image with clean filename generator
router.post('/upload-image', protect, admin, cleanImageUpload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
    }
    // Also mirror to uploadsDir
    try {
      const mirrorPath = path.join(uploadsDir, req.file.filename);
      fs.copyFileSync(req.file.path, mirrorPath);
    } catch (copyErr) {
      console.warn('Mirror to uploads dir warning:', copyErr.message);
    }
    const publicUrl = `/assets/products/${req.file.filename}`;
    res.status(201).json({
      success: true,
      url: publicUrl,
      filename: req.file.filename,
      message: 'Product image uploaded successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Upload failed: ' + err.message });
  }
});

// Helper to join images, variants, and categories from MongoDB when stored in separate collections
async function enrichProductDocs(products) {
  if (!products) return products;
  const isArray = Array.isArray(products);
  const list = isArray ? products : [products];
  if (list.length === 0) return products;

  try {
    const ids = list.map(p => p._id);
    let images = [];
    let variants = [];
    let categories = [];

    if (mongoose.connection && mongoose.connection.db) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const colNames = collections.map(c => c.name);

      if (colNames.includes('ProductImage')) {
        images = await mongoose.connection.db.collection('ProductImage').find({ productId: { $in: ids } }).toArray();
      }
      if (colNames.includes('ProductVariant')) {
        variants = await mongoose.connection.db.collection('ProductVariant').find({ productId: { $in: ids } }).toArray();
      }
      if (colNames.includes('Category')) {
        categories = await mongoose.connection.db.collection('Category').find({}).toArray();
      }
    }

    const catMap = {};
    categories.forEach(c => { catMap[String(c._id)] = c; });

    const imgMap = {};
    images.forEach(im => {
      const pid = String(im.productId);
      if (!imgMap[pid]) imgMap[pid] = [];
      imgMap[pid].push({
        url: im.url,
        alt: im.alt || 'Product Image',
        isPrimary: im.isPrimary || false,
        sortOrder: im.sortOrder || 0
      });
    });

    const varMap = {};
    variants.forEach(v => {
      const pid = String(v.productId);
      if (!varMap[pid]) varMap[pid] = [];
      varMap[pid].push(v);
    });

    const enriched = list.map(p => {
      const plain = (p && typeof p.toObject === 'function') ? p.toObject() : { ...p };
      const pid = String(plain._id);

      // Attach category object if not already hydrated
      if (!plain.category || typeof plain.category !== 'object' || !plain.category.name) {
        const catKey = String(plain.categoryId || plain.category || '');
        if (catMap[catKey]) {
          plain.category = catMap[catKey];
        }
      }

      // Attach images from ProductImage collection or local assets
      if (!plain.images || !Array.isArray(plain.images) || plain.images.length === 0) {
        if (imgMap[pid] && imgMap[pid].length > 0) {
          plain.images = imgMap[pid];
        } else {
          const name = (plain.name || '').toLowerCase();
          let fallbackUrl = '/public/images/products/whey.jpg';
          if (name.includes('creatine')) fallbackUrl = '/public/images/products/creatine.jpg';
          else if (name.includes('mass')) fallbackUrl = '/public/images/products/mass-gainer.jpg';
          else if (name.includes('pre-workout') || name.includes('hyperdrive')) fallbackUrl = '/public/images/products/pre-workout.jpg';
          else if (name.includes('carnitine')) fallbackUrl = '/public/images/products/l-carnitine.jpg';
          else if (name.includes('shred')) fallbackUrl = '/public/images/products/shred-whey.jpg';
          else if (name.includes('dina') || name.includes('bol')) fallbackUrl = '/public/images/products/dinabol.jpg';
          plain.images = [{ url: fallbackUrl, alt: plain.name, isPrimary: true, sortOrder: 0 }];
        }
      }
      if (!plain.image && plain.images && plain.images[0]) {
        plain.image = plain.images[0].url;
      }

      // Attach variants if not present
      if ((!plain.variants || plain.variants.length === 0) && varMap[pid]) {
        plain.variants = varMap[pid];
      }

      return plain;
    });

    return isArray ? enriched : enriched[0];
  } catch (enrichErr) {
    console.warn('Product enrichment warning:', enrichErr.message);
    return products;
  }
}

// GET /api/products/best - Algorithmic "Best Products" ranking
router.get('/best', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    let allProducts = [];

    if (!global.USE_MONGODB) {
      allProducts = [...mockDb.products];
    } else {
      allProducts = await Product.find({ isActive: true }).populate('category', 'name slug');
      allProducts = await enrichProductDocs(allProducts);
    }

    // Weighted Ranking: Rating (weight 20) + Reviews (weight 0.5) + BestSeller badge (25 pts) + Views (0.1)
    const ranked = allProducts.map(p => {
      const ratingScore = (p.rating || 4.5) * 20;
      const reviewScore = Math.min(50, (p.reviewCount || 0) * 0.5);
      const sellerScore = p.isBestSeller ? 25 : 0;
      const viewScore = Math.min(25, (p.viewCount || 0) * 0.05);
      const compositeScore = ratingScore + reviewScore + sellerScore + viewScore;
      return { product: p, score: compositeScore };
    });

    ranked.sort((a, b) => b.score - a.score);
    const topProducts = ranked.slice(0, Number(limit)).map(item => item.product);

    res.json({ success: true, products: topProducts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/inventory/alerts - Admin stock alerts (low stock + out of stock)
router.get('/inventory/alerts', protect, admin, async (req, res) => {
  try {
    let allProducts = [];
    if (!global.USE_MONGODB) {
      allProducts = mockDb.products;
    } else {
      allProducts = await Product.find({ isActive: true });
    }

    const lowStock = [];
    const outOfStock = [];

    allProducts.forEach(p => {
      const threshold = p.lowStockThreshold || 10;
      const stock = p.stock !== undefined ? p.stock : 25;
      if (stock === 0) {
        outOfStock.push(p);
      } else if (stock <= threshold) {
        lowStock.push(p);
      }
    });

    const getSubCount = (id) => (mockDb.stockAlertSubscribers || []).filter(s => s.productId === id).length;

    const formattedLow = lowStock.map(p => ({
      ...(p.toObject ? p.toObject() : p),
      subscribersCount: getSubCount(p._id)
    }));

    const formattedOut = outOfStock.map(p => ({
      ...(p.toObject ? p.toObject() : p),
      subscribersCount: getSubCount(p._id)
    }));

    res.json({
      success: true,
      alerts: {
        lowStock: formattedLow,
        outOfStock: formattedOut
      },
      lowStock: formattedLow,
      outOfStock: formattedOut,
      subscribersCount: mockDb.stockAlertSubscribers ? mockDb.stockAlertSubscribers.length : 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products/notify-stock - Customer stock notification subscription
router.post('/notify-stock', async (req, res) => {
  try {
    const { productId, email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    if (!mockDb.stockAlertSubscribers) mockDb.stockAlertSubscribers = [];
    const existing = mockDb.stockAlertSubscribers.find(s => s.productId === productId && s.email.toLowerCase() === email.toLowerCase());
    if (!existing) {
      mockDb.stockAlertSubscribers.push({
        productId,
        email: email.toLowerCase().trim(),
        createdAt: new Date()
      });
    }

    res.json({
      success: true,
      message: "You're all set! We will notify you as soon as this item is back in stock."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/verify/:barcode - public barcode verification
router.get('/verify/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    if (!barcode || barcode.length < 3) {
      return res.status(400).json({ success: false, message: 'A valid barcode is required.' });
    }

    let product;
    if (!global.USE_MONGODB) {
      product = mockDb.products.find(p =>
        p.barcode === barcode || p.sku === barcode ||
        (p.variants && p.variants.some(v => v.sku === barcode))
      );
    } else {
      product = await Product.findOne({ $or: [{ barcode }, { sku: barcode }] });
    }

    // Log verification attempt
    if (!mockDb.barcodeVerifications) mockDb.barcodeVerifications = [];
    mockDb.barcodeVerifications.unshift({
      barcode,
      found: !!product,
      productId: product ? product._id : null,
      timestamp: new Date(),
      ip: req.ip || '127.0.0.1'
    });
    if (mockDb.barcodeVerifications.length > 200) mockDb.barcodeVerifications = mockDb.barcodeVerifications.slice(0, 200);

    if (!product) {
      return res.json({
        success: true,
        verified: false,
        message: 'This barcode was not found in the NUTRATEIN product database. This may indicate an unregistered, counterfeit, or incorrectly entered barcode.',
        barcode,
        verificationDate: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      verified: true,
      message: 'Product found in the NUTRATEIN database.',
      barcode,
      product: {
        _id: product._id,
        name: product.name,
        brand: product.brand,
        sku: product.sku,
        barcode: product.barcode,
        category: product.category,
        image: product.images && product.images[0] ? product.images[0].url : null,
        rating: product.rating,
        isActive: product.isActive
      },
      verificationDate: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id/barcode - admin: set barcode
router.put('/:id/barcode', protect, admin, async (req, res) => {
  try {
    const { barcode } = req.body;
    if (!barcode) return res.status(400).json({ success: false, message: 'Barcode is required.' });

    // Check for duplicates
    const duplicate = mockDb.products.find(p => p.barcode === barcode && p._id !== req.params.id);
    if (duplicate) {
      return res.status(400).json({ success: false, message: `Barcode already assigned to: ${duplicate.name}`, duplicateProduct: duplicate.name });
    }

    if (!global.USE_MONGODB) {
      const p = mockDb.products.find(item => item._id === req.params.id || item.slug === req.params.id);
      if (!p) return res.status(404).json({ success: false, message: 'Product not found.' });
      p.barcode = barcode;
      return res.json({ success: true, message: 'Barcode updated.', product: p });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, { barcode }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, message: 'Barcode updated.', product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/barcodes - admin: list all barcodes
router.get('/barcodes', protect, admin, async (req, res) => {
  try {
    if (!global.USE_MONGODB) {
      const barcodeList = mockDb.products.map(p => ({
        _id: p._id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode || null,
        stock: p.stock
      }));
      return res.json({ success: true, products: barcodeList, verifications: (mockDb.barcodeVerifications || []).slice(0, 50) });
    }
    const products = await Product.find({}, 'name sku barcode stock');
    res.json({ success: true, products, verifications: (mockDb.barcodeVerifications || []).slice(0, 50) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const { sendEmail } = require('../services/emailService');

// Helper: send low stock alert with 24-hour cooldown
async function triggerLowStockAlertIfNeeded(productId, productName, currentStock, threshold) {
  try {
    if (currentStock > threshold) return;
    if (!mockDb.lowStockAlertCooldowns) mockDb.lowStockAlertCooldowns = {};
    const lastAlert = mockDb.lowStockAlertCooldowns[productId];
    const now = Date.now();
    const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

    if (lastAlert && (now - lastAlert) < COOLDOWN_MS) {
      // Cooldown active, skip sending duplicate alert
      return;
    }

    mockDb.lowStockAlertCooldowns[productId] = now;
    const adminEmail = (mockDb.storeSettings && mockDb.storeSettings.storeEmail) || process.env.ADMIN_EMAIL || 'kaziadnan275@gmail.com';

    await sendEmail(adminEmail, 'lowStock', {
      productName,
      currentStock,
      threshold
    });
  } catch (err) {
    console.warn('Low stock alert trigger failed:', err.message);
  }
}

router.put('/:id/stock', protect, admin, async (req, res) => {
  try {
    const { stock, lowStockThreshold } = req.body;
    const { id } = req.params;

    if (!global.USE_MONGODB) {
      const p = mockDb.products.find(item => item._id === id || item.slug === id);
      if (!p) return res.status(404).json({ success: false, message: 'Product not found.' });
      if (stock !== undefined) p.stock = Number(stock);
      if (lowStockThreshold !== undefined) p.lowStockThreshold = Number(lowStockThreshold);

      const threshold = p.lowStockThreshold || (mockDb.storeSettings && mockDb.storeSettings.lowStockGlobalThreshold) || 10;
      await triggerLowStockAlertIfNeeded(p._id, p.name, p.stock, threshold);

      return res.json({ success: true, message: 'Stock updated successfully.', product: p });
    }

    const update = {};
    if (stock !== undefined) update.stock = Number(stock);
    if (lowStockThreshold !== undefined) update.lowStockThreshold = Number(lowStockThreshold);

    const product = await Product.findByIdAndUpdate(id, update, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const threshold = product.lowStockThreshold || 10;
    await triggerLowStockAlertIfNeeded(product._id, product.name, product.stock, threshold);

    res.json({ success: true, message: 'Stock updated successfully.', product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, rating, isBestSeller, isNew, isFeatured, sort, page = 1, limit = 12, search, includeInactive, status, stockStatus } = req.query;
    const showAll = includeInactive === 'true' || includeInactive === true;

    if (!global.USE_MONGODB) {
      let filtered = [...mockDb.products];
      if (!showAll) {
        filtered = filtered.filter(p => p.isActive !== false && p.status !== 'inactive' && p.status !== 'draft');
      }
      if (status && status !== 'all') {
        filtered = filtered.filter(p => (p.status || (p.isActive ? 'active' : 'inactive')) === status);
      }
      if (stockStatus && stockStatus !== 'all') {
        if (stockStatus === 'in_stock') filtered = filtered.filter(p => (p.stock || 0) > 10);
        else if (stockStatus === 'low_stock') filtered = filtered.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10);
        else if (stockStatus === 'out_of_stock') filtered = filtered.filter(p => (p.stock || 0) === 0);
      }
      if (category && category !== 'all') {
        const cLower = category.toLowerCase();
        filtered = filtered.filter(p => {
          const catName = (p.category?.name || p.category?.slug || p.category || '').toLowerCase();
          return catName.includes(cLower) || cLower.includes(catName);
        });
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p => 
          (p.name && p.name.toLowerCase().includes(q)) || 
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.variants && p.variants.some(v => v.sku && v.sku.toLowerCase().includes(q)))
        );
      }
      if (minPrice) filtered = filtered.filter(p => (p.basePrice || p.price || 0) >= Number(minPrice));
      if (maxPrice) filtered = filtered.filter(p => (p.basePrice || p.price || 0) <= Number(maxPrice));
      if (rating) filtered = filtered.filter(p => (p.rating || 0) >= Number(rating));
      if (isBestSeller === 'true') filtered = filtered.filter(p => p.isBestSeller);
      if (isNew === 'true') filtered = filtered.filter(p => p.isNew);
      if (isFeatured === 'true') filtered = filtered.filter(p => p.isFeatured);

      if (sort === 'price_asc') filtered.sort((a, b) => (a.basePrice || a.price || 0) - (b.basePrice || b.price || 0));
      else if (sort === 'price_desc') filtered.sort((a, b) => (b.basePrice || b.price || 0) - (a.basePrice || a.price || 0));
      else if (sort === 'rating') filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));

      const skip = (Number(page) - 1) * Number(limit);
      const paginated = filtered.slice(skip, skip + Number(limit));

      return res.json({
        success: true,
        products: paginated,
        total: filtered.length,
        page: Number(page),
        pages: Math.ceil(filtered.length / Number(limit))
      });
    }

    const query = {};
    if (!showAll) {
      query.isActive = true;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (stockStatus && stockStatus !== 'all') {
      if (stockStatus === 'in_stock') query.stock = { $gt: 10 };
      else if (stockStatus === 'low_stock') query.stock = { $gt: 0, $lte: 10 };
      else if (stockStatus === 'out_of_stock') query.stock = { $lte: 0 };
    }
    if (category && category !== 'all') {
      if (mongoose.Types.ObjectId.isValid(category) && String(new mongoose.Types.ObjectId(category)) === category) {
        query.category = category;
      } else {
        const foundCat = await Category.findOne({
          $or: [
            { slug: category.toLowerCase() },
            { name: new RegExp('^' + category + '$', 'i') }
          ]
        });
        if (foundCat) {
          query.category = foundCat._id;
        } else {
          return res.json({ success: true, products: [], total: 0, page: Number(page), pages: 0 });
        }
      }
    }
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { brand: new RegExp(search, 'i') },
        { sku: new RegExp(search, 'i') },
        { 'variants.sku': new RegExp(search, 'i') }
      ];
    }
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = Number(minPrice);
      if (maxPrice) query.basePrice.$lte = Number(maxPrice);
    }
    if (isBestSeller === 'true') query.isBestSeller = true;
    if (isNew === 'true') query.isNew = true;
    if (isFeatured === 'true') query.isFeatured = true;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    let products = await Product.find(query).populate('category', 'name slug').skip(skip).limit(Number(limit));
    products = await enrichProductDocs(products);

    res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/search
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 8 } = req.query;
    if (!q) return res.json({ success: true, products: [] });

    if (!global.USE_MONGODB) {
      const needle = q.toLowerCase();
      const matched = mockDb.products
        .filter(p => p.name.toLowerCase().includes(needle) || p.brand.toLowerCase().includes(needle))
        .slice(0, Number(limit));
      return res.json({ success: true, products: matched });
    }

    let products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } }
      ]
    }).limit(Number(limit));
    products = await enrichProductDocs(products);

    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PRODUCT ASSET DETECTION & NORMALIZATION HELPERS ───────────

function normalizeProductFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  let base = path.basename(filename, ext).trim();

  let galleryRole = 'main';
  let alt = 'Front Product Image';
  let sortOrder = 0;

  const lowerBase = base.toLowerCase();
  if (lowerBase.endsWith('-main') || lowerBase.endsWith('_main') || lowerBase.endsWith(' main') || lowerBase.endsWith('-front') || lowerBase.endsWith('_front')) {
    galleryRole = 'main';
    alt = 'Front Product Image';
    base = base.replace(/[-_ ](main|front)$/i, '');
  } else if (lowerBase.endsWith('-back') || lowerBase.endsWith('_back') || lowerBase.endsWith(' back')) {
    galleryRole = 'back';
    alt = 'Back Packaging & Nutrition';
    sortOrder = 1;
    base = base.replace(/[-_ ]back$/i, '');
  } else if (lowerBase.endsWith('-nutrition') || lowerBase.endsWith('_nutrition') || lowerBase.endsWith(' nutrition')) {
    galleryRole = 'nutrition';
    alt = 'Supplement Facts Label';
    sortOrder = 2;
    base = base.replace(/[-_ ]nutrition$/i, '');
  } else if (lowerBase.endsWith('-ingredients') || lowerBase.endsWith('_ingredients') || lowerBase.endsWith(' ingredients')) {
    galleryRole = 'ingredients';
    alt = 'Ingredients Label';
    sortOrder = 3;
    base = base.replace(/[-_ ]ingredients$/i, '');
  } else if (lowerBase.endsWith('-lifestyle') || lowerBase.endsWith('_lifestyle') || lowerBase.endsWith(' lifestyle') || lowerBase.endsWith('-alt')) {
    galleryRole = 'lifestyle';
    alt = 'Lifestyle & Workout Usage';
    sortOrder = 4;
    base = base.replace(/[-_ ](lifestyle|alt)$/i, '');
  }

  // Normalize delimiters and whitespace
  let cleaned = base.toLowerCase()
    .replace(/[+&._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Spell correction & common abbreviations (handles createin, whet, lcarnitine, etc.)
  cleaned = cleaned
    .replace(/\bcreatein\b/g, 'creatine')
    .replace(/\bwhet\b/g, 'whey')
    .replace(/\blcarnitine\b/g, 'l-carnitine')
    .replace(/\bl carnitine\b/g, 'l-carnitine')
    .replace(/\bcarnitine\b/g, 'l-carnitine')
    .replace(/\bpreworkout\b/g, 'pre-workout')
    .replace(/\bpre workout\b/g, 'pre-workout')
    .replace(/\bmass tein\b/g, 'mass gainer')
    .replace(/\bmasstein\b/g, 'mass gainer')
    .replace(/\bshred tein\b/g, 'whey')
    .replace(/\bnitro tein\b/g, 'whey')
    .replace(/\bfishoil\b/g, 'fish oil')
    .replace(/\bmultivit\b/g, 'multivitamin')
    .replace(/\bmulti vitamin\b/g, 'multivitamin');

  // Detect category from filename
  let detectedCategory = 'Supplements';
  if (cleaned.includes('whey') || cleaned.includes('protein')) detectedCategory = 'Whey Protein';
  else if (cleaned.includes('creatine')) detectedCategory = 'Creatine';
  else if (cleaned.includes('pre-workout')) detectedCategory = 'Pre-Workout';
  else if (cleaned.includes('mass') || cleaned.includes('gainer')) detectedCategory = 'Mass Gainers';
  else if (cleaned.includes('carnitine') || cleaned.includes('bcaa') || cleaned.includes('eaa') || cleaned.includes('amino')) detectedCategory = 'BCAA / EAA';
  else if (cleaned.includes('vitamin') || cleaned.includes('omega') || cleaned.includes('fish oil') || cleaned.includes('zma')) detectedCategory = 'Vitamins';

  return {
    rawName: filename,
    base,
    cleaned,
    galleryRole,
    alt,
    sortOrder,
    detectedCategory
  };
}

function matchProductWithCatalog(normalized, catalogProducts) {
  const cleanNeedle = normalized.cleaned;
  const needleWords = cleanNeedle.split(' ').filter(w => w.length > 1);

  let bestMatch = null;
  let bestScore = 0;

  for (const p of catalogProducts) {
    const pName = (p.name || '').toLowerCase();
    const pSlug = (p.slug || '').toLowerCase();
    const pTags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : '';
    const pCat = p.category ? (p.category.name || p.category.slug || p.category || '').toLowerCase() : '';

    let score = 0;

    // Direct match with slug or exact name
    if (pSlug === cleanNeedle.replace(/\s+/g, '-')) score += 100;
    else if (pName === cleanNeedle) score += 95;
    else if (pName.includes(cleanNeedle) || cleanNeedle.includes(pName)) score += 80;

    // Word token matching
    let matchedWords = 0;
    for (const w of needleWords) {
      if (pName.includes(w) || pSlug.includes(w) || pTags.includes(w)) {
        matchedWords++;
      }
    }
    if (needleWords.length > 0) {
      const wordScore = (matchedWords / needleWords.length) * 70;
      score = Math.max(score, wordScore);
    }

    // Category boost
    if (normalized.detectedCategory && pCat.includes(normalized.detectedCategory.toLowerCase().slice(0, 5))) {
      score += 15;
    }

    if (score > bestScore && score >= 50) {
      bestScore = score;
      bestMatch = { product: p, score: Math.round(score) };
    }
  }

  return bestMatch;
}

function getCandidateAssetDirs() {
  const dirs = [
    { dir: path.join(__dirname, '../../frontend/assets/images'), prefix: '/assets/images/' },
    { dir: path.join(__dirname, '../../frontend/assets/products'), prefix: '/assets/products/' },
    { dir: path.join(__dirname, '../../public/images/products'), prefix: '/public/images/products/' },
    { dir: path.join(__dirname, '../../public/assets/products'), prefix: '/public/assets/products/' },
    { dir: path.join(__dirname, '../uploads'), prefix: '/uploads/' }
  ];
  return dirs.filter(d => fs.existsSync(d.dir));
}

// ── GET /api/products/scan-assets ──────────────────────────────
// Admin: scans product image folders, normalizes filenames, and matches against DB products
async function executeAssetScan() {
  let catalogProducts = [];
  if (!global.USE_MONGODB) {
    catalogProducts = [...mockDb.products];
  } else {
    catalogProducts = await Product.find().populate('category', 'name slug');
  }

  const candidateDirs = getCandidateAssetDirs();
  const seenFiles = new Set();
  const scannedItems = [];

  for (const cDir of candidateDirs) {
    try {
      const files = fs.readdirSync(cDir.dir);
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'].includes(ext)) continue;
        if (seenFiles.has(file.toLowerCase())) continue;
        seenFiles.add(file.toLowerCase());

        const stat = fs.statSync(path.join(cDir.dir, file));
        const normalized = normalizeProductFilename(file);
        const matchResult = matchProductWithCatalog(normalized, catalogProducts);

        const item = {
          filename: file,
          url: cDir.prefix + file,
          size: stat.size,
          detectedCategory: normalized.detectedCategory,
          galleryRole: normalized.galleryRole,
          alt: normalized.alt,
          sortOrder: normalized.sortOrder,
          matched: !!matchResult,
          match: matchResult ? {
            productId: matchResult.product._id,
            productName: matchResult.product.name,
            slug: matchResult.product.slug,
            category: matchResult.product.category?.name || matchResult.product.category,
            currentPrice: matchResult.product.basePrice || matchResult.product.price || 0,
            priceNotConfigured: matchResult.product.priceNotConfigured || false,
            score: matchResult.score,
            currentImagesCount: (matchResult.product.images || []).length
          } : null
        };
        scannedItems.push(item);
      }
    } catch (e) {
      console.warn('Error reading asset dir:', cDir.dir, e.message);
    }
  }

  const matched = scannedItems.filter(i => i.matched);
  const unmatched = scannedItems.filter(i => !i.matched);

  // Detect duplicate matches (multiple images matching same product)
  const productMatchCounts = {};
  matched.forEach(m => {
    const pid = m.match.productId;
    productMatchCounts[pid] = (productMatchCounts[pid] || 0) + 1;
  });
  const duplicates = matched.filter(m => productMatchCounts[m.match.productId] > 1);

  const simplifiedProducts = catalogProducts.map(p => ({
    _id: p._id,
    name: p.name,
    slug: p.slug,
    category: p.category?.name || p.category,
    basePrice: p.basePrice || p.price || 0,
    priceNotConfigured: p.priceNotConfigured || false,
    imagesCount: (p.images || []).length
  }));

  return {
    totalDetected: scannedItems.length,
    matchedCount: matched.length,
    unmatchedCount: unmatched.length,
    duplicatesCount: duplicates.length,
    matched,
    unmatched,
    duplicates,
    productsList: simplifiedProducts
  };
}

router.get('/scan-assets', protect, admin, async (req, res) => {
  try {
    const result = await executeAssetScan();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Asset scan failed: ' + err.message });
  }
});

router.post('/scan-assets', protect, admin, async (req, res) => {
  try {
    const result = await executeAssetScan();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Asset scan failed: ' + err.message });
  }
});

// ── POST /api/products/apply-asset-matches ─────────────────────
// Admin: confirms and applies matched images to database products
router.post('/apply-asset-matches', protect, admin, async (req, res) => {
  try {
    const { matches } = req.body;
    if (!Array.isArray(matches) || matches.length === 0) {
      return res.status(400).json({ success: false, message: 'No matches provided to apply.' });
    }

    let updatedCount = 0;
    let createdCount = 0;

    for (const item of matches) {
      const { filename, url, productId, isNew, newName, categoryName, galleryRole = 'main', sortOrder = 0 } = item;
      if (!url) continue;

      const imgObj = {
        url,
        alt: item.alt || (galleryRole === 'main' ? 'Front Product Image' : `${galleryRole} Image`),
        isPrimary: galleryRole === 'main' || sortOrder === 0,
        sortOrder: Number(sortOrder) || 0
      };

      // Case 1: Update existing product (DO NOT change price, DO NOT duplicate)
      if (productId && !isNew) {
        if (!global.USE_MONGODB) {
          const product = mockDb.products.find(p => p._id === productId || p.slug === productId);
          if (product) {
            if (!product.images || !Array.isArray(product.images)) product.images = [];
            // Remove if this URL is already in images to avoid duplicate entry in gallery
            product.images = product.images.filter(im => (im.url || im) !== url);

            if (imgObj.isPrimary) {
              product.images.forEach(im => im.isPrimary = false);
              product.images.unshift(imgObj);
            } else {
              product.images.push(imgObj);
            }
            product.image = product.images[0]?.url || url;
            updatedCount++;
          }
        } else {
          const product = await Product.findById(productId);
          if (product) {
            if (!product.images) product.images = [];
            product.images = product.images.filter(im => im.url !== url);

            if (imgObj.isPrimary) {
              product.images.forEach(im => im.isPrimary = false);
              product.images.unshift(imgObj);
            } else {
              product.images.push(imgObj);
            }
            await product.save();
            updatedCount++;
          }
        }
      } 
      // Case 2: Create safe new product (only when requested, with "Price not configured")
      else if (isNew && newName) {
        const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        // Double check for duplicate product before creation
        let existing = null;
        if (!global.USE_MONGODB) {
          existing = mockDb.products.find(p => p.slug === slug || p.name.toLowerCase() === newName.toLowerCase());
        } else {
          existing = await Product.findOne({ $or: [{ slug }, { name: new RegExp(`^${newName}$`, 'i') }] });
        }

        if (existing) {
          // Update existing rather than creating duplicate!
          if (!existing.images) existing.images = [];
          existing.images = existing.images.filter(im => (im.url || im) !== url);
          existing.images.unshift(imgObj);
          if (global.USE_MONGODB) await existing.save();
          updatedCount++;
          continue;
        }

        // Find or fallback category
        let categoryId = 'cat_whey';
        if (categoryName) {
          const catLower = categoryName.toLowerCase();
          if (catLower.includes('creatine')) categoryId = 'cat_creatine';
          else if (catLower.includes('mass')) categoryId = 'cat_mass';
          else if (catLower.includes('pre')) categoryId = 'cat_pre';
          else if (catLower.includes('bcaa') || catLower.includes('amino') || catLower.includes('carnitine')) categoryId = 'cat_bcaa';
          else if (catLower.includes('plant')) categoryId = 'cat_plant';
          else if (catLower.includes('vit')) categoryId = 'cat_vitamins';
        }

        const newProdData = {
          _id: 'p_' + Date.now() + Math.floor(Math.random() * 100),
          name: newName,
          slug,
          brand: 'NUTRATEIN',
          sku: 'NUT-' + slug.slice(0, 6).toUpperCase(),
          category: { _id: categoryId, name: categoryName || 'Supplements', slug: categoryId.replace('cat_', '') },
          description: `Premium grade ${newName} formulated by NUTRATEIN for peak athletic performance.`,
          shortDescription: `${newName} premium supplement formulation.`,
          images: [imgObj],
          basePrice: 0,
          mrp: 0,
          priceNotConfigured: true,
          discountPercent: 0,
          stock: 0,
          rating: 4.8,
          reviewCount: 0,
          isActive: true,
          isNew: true,
          variants: [{ flavor: 'Standard', size: '1 Unit', sku: 'PX-' + slug.slice(0, 4).toUpperCase() + '-STD', price: 0, stock: 0 }]
        };

        if (!global.USE_MONGODB) {
          mockDb.products.unshift(newProdData);
          createdCount++;
        } else {
          // Resolve category ObjectId if MongoDB
          let catDoc = await Category.findOne({ name: new RegExp(categoryName || 'Whey', 'i') });
          if (!catDoc) catDoc = await Category.findOne();
          newProdData.category = catDoc ? catDoc._id : null;
          await Product.create(newProdData);
          createdCount++;
        }
      }
    }

    logAdminAction(req.user, 'PRODUCT_ASSETS_APPLIED', 'PRODUCTS', `Applied image matches: ${updatedCount} updated, ${createdCount} created.`);
    res.json({
      success: true,
      message: `Asset match complete: ${updatedCount} products updated, ${createdCount} new products registered.`,
      updatedCount,
      createdCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to apply matches: ' + err.message });
  }
});

// ── PUT /api/products/:id/images ───────────────────────────────
// Admin: update image gallery for a specific product
router.put('/:id/images', protect, admin, async (req, res) => {
  try {
    const { images } = req.body;
    if (!Array.isArray(images)) {
      return res.status(400).json({ success: false, message: 'images must be an array.' });
    }

    const formattedImages = images.map((im, idx) => {
      if (typeof im === 'string') {
        return { url: im, alt: 'Product Image', isPrimary: idx === 0, sortOrder: idx };
      }
      return {
        url: im.url,
        alt: im.alt || (im.isPrimary || idx === 0 ? 'Front Product Image' : 'Gallery Image'),
        isPrimary: im.isPrimary !== undefined ? im.isPrimary : idx === 0,
        sortOrder: im.sortOrder !== undefined ? im.sortOrder : idx
      };
    });

    if (!global.USE_MONGODB) {
      const product = mockDb.products.find(p => p._id === req.params.id || p.slug === req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
      product.images = formattedImages;
      product.image = formattedImages[0]?.url || '';
      logAdminAction(req.user, 'PRODUCT_IMAGES_UPDATED', 'PRODUCTS', `Updated images for ${product.name}`);
      return res.json({ success: true, message: 'Product images updated.', product });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { images: formattedImages },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    logAdminAction(req.user, 'PRODUCT_IMAGES_UPDATED', 'PRODUCTS', `Updated images for ${product.name}`);
    res.json({ success: true, message: 'Product images updated.', product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/products/:id/images/upload ───────────────────────
// Admin: direct upload of image to a product's gallery
router.post('/:id/images/upload', protect, admin, productImageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const newImage = {
      url: fileUrl,
      alt: req.body.alt || 'Product Image',
      isPrimary: req.body.isPrimary === 'true' || req.body.isPrimary === true,
      sortOrder: Number(req.body.sortOrder) || 0
    };

    if (!global.USE_MONGODB) {
      const product = mockDb.products.find(p => p._id === req.params.id || p.slug === req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
      if (!product.images) product.images = [];
      if (newImage.isPrimary) {
        product.images.forEach(im => im.isPrimary = false);
        product.images.unshift(newImage);
      } else {
        product.images.push(newImage);
      }
      product.image = product.images[0]?.url || fileUrl;
      return res.status(201).json({ success: true, message: 'Image uploaded and added to product.', file: newImage, product });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    if (!product.images) product.images = [];
    if (newImage.isPrimary) {
      product.images.forEach(im => im.isPrimary = false);
      product.images.unshift(newImage);
    } else {
      product.images.push(newImage);
    }
    await product.save();

    res.status(201).json({ success: true, message: 'Image uploaded and added to product.', file: newImage, product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Upload failed: ' + err.message });
  }
});

// GET /api/products/:slug
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    if (!global.USE_MONGODB) {
      const product = mockDb.products.find(p => p.slug === req.params.slug);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      return res.json({
        success: true,
        product,
        reviews: [
          { user: { name: 'Aman K.' }, rating: 5, title: 'Outstanding Quality', body: 'Best protein supplement in the market. Clean taste and zero bloating.' },
          { user: { name: 'Vikram S.' }, rating: 5, title: 'Authentic Product', body: 'Received with verified security seal. Fast delivery.' }
        ]
      });
    }

    const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate('category', 'name slug');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const enriched = await enrichProductDocs(product);
    const reviews = await Review.find({ product: product._id, isApproved: true }).populate('user', 'name');
    res.json({ success: true, product: enriched, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper to process variant discounts, price boundaries, and total stock
function processProductVariantsAndPrices(body) {
  let parsedVariants = body.variants;
  if (typeof parsedVariants === 'string') {
    try { parsedVariants = JSON.parse(parsedVariants); } catch (e) { parsedVariants = []; }
  }
  if (!Array.isArray(parsedVariants)) parsedVariants = [];

  parsedVariants = parsedVariants.map((v, idx) => {
    const price = Number(v.price) || 0;
    const originalPrice = Number(v.originalPrice || v.mrp) || (price > 0 ? Math.round(price * 1.3) : 0);
    const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : (Number(v.discount) || 0);
    const stock = Number(v.stock) || 0;
    const status = stock === 0 ? 'out_of_stock' : (stock <= 10 ? 'low_stock' : 'in_stock');
    const weight = v.weight || v.size || '';
    const sku = v.sku || `NUT-${(weight || 'VAR').toUpperCase().replace(/[^A-Z0-9]/g, '')}-${idx + 1}`;

    return {
      _id: v._id || ('v_' + Date.now() + '_' + idx),
      weight,
      size: weight,
      flavor: v.flavor || '',
      servings: Number(v.servings) || 0,
      price,
      originalPrice,
      mrp: originalPrice,
      discount,
      discountPercent: discount,
      stock,
      status,
      sku,
      image: v.image || '',
      isDefault: v.isDefault === true || idx === 0,
      isActive: v.isActive !== false
    };
  });

  let basePrice = Number(body.basePrice) || 0;
  let mrp = Number(body.mrp) || (basePrice > 0 ? Math.round(basePrice * 1.3) : 0);
  let minPrice = basePrice;
  let maxPrice = mrp;
  let totalStock = Number(body.stock) || 0;

  if (parsedVariants.length > 0) {
    const activeVariants = parsedVariants.filter(v => v.isActive !== false);
    const varPool = activeVariants.length > 0 ? activeVariants : parsedVariants;
    const prices = varPool.map(v => v.price).filter(p => p > 0);
    const mrps = varPool.map(v => v.originalPrice || v.mrp || v.price).filter(p => p > 0);

    if (prices.length > 0) {
      basePrice = Math.min(...prices);
      minPrice = Math.min(...prices);
      maxPrice = Math.max(...prices);
    }
    if (mrps.length > 0) {
      mrp = Math.max(...mrps);
    }
    totalStock = parsedVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }

  const discountPercent = mrp > basePrice ? Math.round(((mrp - basePrice) / mrp) * 100) : (Number(body.discountPercent) || 0);

  return {
    variants: parsedVariants,
    basePrice,
    mrp,
    minPrice,
    maxPrice,
    discountPercent,
    stock: totalStock,
    totalStock,
    priceNotConfigured: basePrice === 0
  };
}

// ── POST /api/products ─────────────────────────────────────────
// Admin: create product safely with multi-variant and image support
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, brand = 'NUTRATEIN', category, subcategory, description, shortDescription, images, badge, status = 'active', isFeatured = false, isBestSeller = false, isNew = false, nutrition } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Product name is required.' });

    const slug = req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const computed = processProductVariantsAndPrices(req.body);

    let parsedImages = Array.isArray(images) ? images : [];
    if (typeof images === 'string') {
      try { parsedImages = JSON.parse(images); } catch (e) {}
    }
    if (parsedImages.length > 0 && typeof parsedImages[0] === 'string') {
      parsedImages = parsedImages.map((url, i) => ({ url, alt: `${name} ${i+1}`, isPrimary: i === 0, sortOrder: i }));
    }

    const primaryImg = parsedImages.find(im => im.isPrimary) || parsedImages[0];
    const image = primaryImg?.url || (parsedImages.length > 0 ? parsedImages[0].url : '/assets/products/nutratein-placeholder.svg');

    // Check duplicate
    if (!global.USE_MONGODB) {
      const duplicate = mockDb.products.find(p => p.slug === slug || p.name.toLowerCase() === name.toLowerCase());
      if (duplicate) {
        return res.status(400).json({ success: false, message: `Product already exists: ${duplicate.name}`, existingProduct: duplicate });
      }
      const newP = {
        _id: 'p_' + Date.now(),
        name,
        slug,
        brand,
        category: category || { _id: 'cat_whey', name: 'Whey Protein', slug: 'whey-protein' },
        subcategory: subcategory || '',
        description: description || name,
        shortDescription: shortDescription || name,
        image,
        images: parsedImages,
        badge: badge || (computed.discountPercent > 15 ? `${computed.discountPercent}% OFF` : ''),
        status,
        isActive: status === 'active',
        isFeatured: Boolean(isFeatured),
        isBestSeller: Boolean(isBestSeller),
        isNew: Boolean(isNew),
        rating: 4.8,
        reviewCount: 0,
        nutrition: nutrition || {},
        ...computed
      };
      mockDb.products.unshift(newP);
      logAdminAction(req.user, 'PRODUCT_CREATED', 'PRODUCTS', `Created product: ${newP.name}`);
      return res.status(201).json({ success: true, message: 'Product created successfully.', product: newP });
    }

    const duplicate = await Product.findOne({ $or: [{ slug }, { name: new RegExp(`^${name}$`, 'i') }] });
    if (duplicate) {
      return res.status(400).json({ success: false, message: `Product already exists: ${duplicate.name}`, existingProduct: duplicate });
    }

    let categoryId = category;
    if (category && typeof category === 'object' && category._id) {
      categoryId = category._id;
    } else if (category && !mongoose.Types.ObjectId.isValid(category)) {
      const foundCat = await Category.findOne({ name: new RegExp(category, 'i') });
      categoryId = foundCat ? foundCat._id : null;
    }

    const product = await Product.create({
      name,
      slug,
      brand,
      category: categoryId,
      subcategory: subcategory || '',
      description: description || name,
      shortDescription: shortDescription || name,
      image,
      images: parsedImages,
      badge: badge || (computed.discountPercent > 15 ? `${computed.discountPercent}% OFF` : ''),
      status,
      isActive: status === 'active',
      isFeatured: Boolean(isFeatured),
      isBestSeller: Boolean(isBestSeller),
      isNew: Boolean(isNew),
      rating: 4.8,
      reviewCount: 0,
      nutrition: nutrition || {},
      ...computed
    });

    logAdminAction(req.user, 'PRODUCT_CREATED', 'PRODUCTS', `Created product: ${product.name}`);
    res.status(201).json({ success: true, message: 'Product created successfully.', product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/products/:id ──────────────────────────────────────
// Admin: update product details, variants, images, prices and status
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.variants || updateData.basePrice || updateData.mrp) {
      const computed = processProductVariantsAndPrices(updateData);
      Object.assign(updateData, computed);
    }
    if (updateData.status) {
      updateData.isActive = updateData.status === 'active';
    } else if (updateData.isActive !== undefined) {
      updateData.status = updateData.isActive ? 'active' : 'inactive';
    }

    if (updateData.images && Array.isArray(updateData.images) && updateData.images.length > 0) {
      const primaryImg = updateData.images.find(im => im.isPrimary) || updateData.images[0];
      updateData.image = primaryImg.url || updateData.image;
    }

    if (!global.USE_MONGODB) {
      const product = mockDb.products.find(p => p._id === req.params.id || p.slug === req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
      Object.assign(product, updateData);
      logAdminAction(req.user, 'PRODUCT_UPDATED', 'PRODUCTS', `Updated product: ${product.name}`);
      return res.json({ success: true, message: 'Product updated successfully.', product });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    logAdminAction(req.user, 'PRODUCT_UPDATED', 'PRODUCTS', `Updated product: ${product.name}`);
    res.json({ success: true, message: 'Product updated successfully.', product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/products/:id/duplicate ───────────────────────────
// Admin: duplicate product with draft status and unique SKUs
router.post('/:id/duplicate', protect, admin, async (req, res) => {
  try {
    if (!global.USE_MONGODB) {
      const original = mockDb.products.find(p => p._id === req.params.id || p.slug === req.params.id);
      if (!original) return res.status(404).json({ success: false, message: 'Product not found.' });
      const copy = JSON.parse(JSON.stringify(original));
      const randSuffix = Date.now().toString().slice(-4);
      copy._id = 'p_' + Date.now();
      copy.name = `${original.name} (Copy)`;
      copy.slug = `${original.slug}-copy-${randSuffix}`;
      copy.status = 'draft';
      copy.isActive = false;
      copy.isFeatured = false;
      copy.isBestSeller = false;
      if (copy.variants && Array.isArray(copy.variants)) {
        copy.variants = copy.variants.map((v, i) => ({
          ...v,
          _id: 'v_' + Date.now() + '_' + i,
          sku: `${v.sku || 'SKU'}-CPY-${randSuffix}`
        }));
      }
      mockDb.products.unshift(copy);
      logAdminAction(req.user, 'PRODUCT_DUPLICATED', 'PRODUCTS', `Duplicated product: ${original.name} -> ${copy.name}`);
      return res.status(201).json({ success: true, message: 'Product duplicated as draft.', product: copy });
    }

    const original = await Product.findById(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: 'Product not found.' });
    const copyData = original.toObject();
    const randSuffix = Date.now().toString().slice(-4);
    delete copyData._id;
    delete copyData.createdAt;
    delete copyData.updatedAt;
    copyData.name = `${original.name} (Copy)`;
    copyData.slug = `${original.slug}-copy-${randSuffix}`;
    copyData.status = 'draft';
    copyData.isActive = false;
    copyData.isFeatured = false;
    copyData.isBestSeller = false;
    if (copyData.variants && Array.isArray(copyData.variants)) {
      copyData.variants = copyData.variants.map((v, i) => ({
        ...v,
        _id: undefined,
        sku: `${v.sku || 'SKU'}-CPY-${randSuffix}`
      }));
    }
    const duplicated = await Product.create(copyData);
    logAdminAction(req.user, 'PRODUCT_DUPLICATED', 'PRODUCTS', `Duplicated product: ${original.name} -> ${duplicated.name}`);
    res.status(201).json({ success: true, message: 'Product duplicated as draft.', product: duplicated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to duplicate product: ' + err.message });
  }
});

// ── PATCH /api/products/:id/toggle-status ──────────────────────
// Admin: toggle active/inactive status
router.patch('/:id/toggle-status', protect, admin, async (req, res) => {
  try {
    if (!global.USE_MONGODB) {
      const p = mockDb.products.find(item => item._id === req.params.id || item.slug === req.params.id);
      if (!p) return res.status(404).json({ success: false, message: 'Product not found.' });
      p.isActive = !p.isActive;
      p.status = p.isActive ? 'active' : 'inactive';
      logAdminAction(req.user, 'PRODUCT_STATUS_TOGGLED', 'PRODUCTS', `Toggled ${p.name} to ${p.status}`);
      return res.json({ success: true, message: `Product ${p.isActive ? 'activated' : 'hidden'}.`, product: p });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    product.isActive = !product.isActive;
    product.status = product.isActive ? 'active' : 'inactive';
    await product.save();

    logAdminAction(req.user, 'PRODUCT_STATUS_TOGGLED', 'PRODUCTS', `Toggled ${product.name} to ${product.status}`);
    res.json({ success: true, message: `Product ${product.isActive ? 'activated' : 'hidden'}.`, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/products/:id ───────────────────────────────────
// Admin: delete product
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    if (!global.USE_MONGODB) {
      const idx = mockDb.products.findIndex(p => p._id === req.params.id || p.slug === req.params.id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Product not found.' });
      const [removed] = mockDb.products.splice(idx, 1);
      logAdminAction(req.user, 'PRODUCT_DELETED', 'PRODUCTS', `Deleted product: ${removed.name}`);
      return res.json({ success: true, message: 'Product deleted.' });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    logAdminAction(req.user, 'PRODUCT_DELETED', 'PRODUCTS', `Deleted product: ${product.name}`);
    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;