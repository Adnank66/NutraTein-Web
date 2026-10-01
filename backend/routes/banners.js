const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Banner = require('../models/Banner');
const mockDb = require('../utils/mockDb');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');
const { logAdminAction } = require('../utils/adminLogger');

// Configure Multer for Banner Uploads
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'banner-' + uniqueSuffix + ext);
  }
});

const bannerFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif|svg|mp4|webm|mov|ogg/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image (JPG, PNG, WEBP, GIF, SVG) or video (MP4, WEBM, MOV) files are allowed for banners.'));
  }
};

const bannerUpload = multer({
  storage: bannerStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for high-res banners and videos
  fileFilter: bannerFileFilter
});

// Helper to ensure mock banners have consistent fields
function getMockBanners() {
  if (!mockDb.banners || !Array.isArray(mockDb.banners)) mockDb.banners = [];
  mockDb.banners.forEach((b, idx) => {
    if (!b._id) b._id = 'ban_' + (idx + 1);
    if (!b.imageUrl && b.image) b.imageUrl = b.image;
    if (!b.image && b.imageUrl) b.image = b.imageUrl;
    if (!b.mobileImageUrl) b.mobileImageUrl = b.imageUrl || b.image;
    if (!b.mediaType) b.mediaType = b.videoUrl ? 'video' : 'image';
    if (!b.videoUrl) b.videoUrl = '';
    if (b.videoAutoplay === undefined) b.videoAutoplay = true;
    if (b.videoMuted === undefined) b.videoMuted = true;
    if (b.videoLoop === undefined) b.videoLoop = true;
    if (!b.link && b.buttonLink) b.link = b.buttonLink;
    if (!b.cta && b.buttonText) b.cta = b.buttonText;
    if (!b.placement) b.placement = 'Homepage Hero';
    if (b.position === undefined) b.position = idx;
    if (b.isActive === undefined) b.isActive = true;
  });
  return mockDb.banners;
}

// ── AUTOMATIC BANNER ASSET DETECTION ────────────────────────────
// Detects banners in frontend/assets/banners (such as Creatine and Whey banners)
async function syncAssetBanners() {
  try {
    const bannerAssetsDir = path.join(__dirname, '../../frontend/assets/banners');
    if (!fs.existsSync(bannerAssetsDir)) return;

    const files = fs.readdirSync(bannerAssetsDir);
    const mockBanners = getMockBanners();

    for (const filename of files) {
      const lower = filename.toLowerCase();
      const ext = path.extname(filename).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) continue;

      const webPath = `/assets/banners/${filename}`;

      // 1. Creatine Banner Detection
      if (lower.includes('createin') || lower.includes('creatine')) {
        const existsInMock = mockBanners.some(b => 
          (b.imageUrl && b.imageUrl.includes(filename)) || 
          (b.title && b.title.toLowerCase().includes('creatine'))
        );

        const creatineBannerData = {
          title: 'CREATINE POWER & EXPLOSIVE STRENGTH',
          subtitle: '100% Pure Micronized Creatine Monohydrate for Maximum Muscle Power & Rapid ATP Recovery',
          imageUrl: webPath,
          mobileImageUrl: webPath,
          image: webPath,
          link: 'shop.html?category=creatine',
          buttonLink: 'shop.html?category=creatine',
          cta: 'Shop Creatine',
          buttonText: 'Shop Creatine',
          badge: 'EXPLOSIVE POWER',
          placement: 'Homepage Hero',
          position: 0,
          isActive: true,
          theme: 'dark'
        };

        if (!existsInMock) {
          mockBanners.unshift({
            _id: 'ban_creatine_auto',
            ...creatineBannerData,
            createdAt: new Date()
          });
        } else {
          // Update existing with correct actual image and placement
          const existing = mockBanners.find(b => 
            (b.imageUrl && b.imageUrl.includes(filename)) || 
            (b.title && b.title.toLowerCase().includes('creatine'))
          );
          if (existing) {
            existing.imageUrl = webPath;
            existing.image = webPath;
            existing.placement = existing.placement || 'Homepage Hero';
            existing.link = existing.link || 'shop.html?category=creatine';
            existing.cta = existing.cta || 'Shop Creatine';
          }
        }

        if (global.USE_MONGODB) {
          const dbBanner = await Banner.findOne({
            $or: [
              { imageUrl: { $regex: filename, $options: 'i' } },
              { title: { $regex: 'creatine', $options: 'i' } }
            ]
          });
          if (!dbBanner) {
            await Banner.create(creatineBannerData);
          } else if (!dbBanner.imageUrl || !dbBanner.imageUrl.includes(filename)) {
            dbBanner.imageUrl = webPath;
            dbBanner.image = webPath;
            dbBanner.placement = dbBanner.placement || 'Homepage Hero';
            await dbBanner.save();
          }
        }
      }

      // 2. Whey Red Banner Detection
      if (lower.includes('whet') || lower.includes('whey')) {
        const existsInMock = mockBanners.some(b => 
          (b.imageUrl && b.imageUrl.includes(filename)) || 
          (b.title && b.title.toLowerCase().includes('nitro-tein'))
        );

        const wheyBannerData = {
          title: 'NITRO-TEIN PURE WHEY',
          subtitle: 'Ultra-Filtered Whey Protein for Maximum Lean Muscle Growth & Rapid Recovery',
          imageUrl: webPath,
          mobileImageUrl: webPath,
          image: webPath,
          link: 'shop.html?category=whey-protein',
          buttonLink: 'shop.html?category=whey-protein',
          cta: 'Shop Whey Protein',
          buttonText: 'Shop Whey Protein',
          badge: 'MAXIMUM RECOVERY',
          placement: 'Homepage Hero',
          position: 1,
          isActive: true,
          theme: 'dark'
        };

        if (!existsInMock) {
          mockBanners.splice(1, 0, {
            _id: 'ban_whey_auto',
            ...wheyBannerData,
            createdAt: new Date()
          });
        } else {
          const existing = mockBanners.find(b => 
            (b.imageUrl && b.imageUrl.includes(filename)) || 
            (b.title && b.title.toLowerCase().includes('nitro-tein'))
          );
          if (existing) {
            existing.imageUrl = webPath;
            existing.image = webPath;
            existing.placement = existing.placement || 'Homepage Hero';
          }
        }

        if (global.USE_MONGODB) {
          const dbBanner = await Banner.findOne({
            $or: [
              { imageUrl: { $regex: filename, $options: 'i' } },
              { title: { $regex: 'nitro-tein', $options: 'i' } }
            ]
          });
          if (!dbBanner) {
            await Banner.create(wheyBannerData);
          } else if (!dbBanner.imageUrl || !dbBanner.imageUrl.includes(filename)) {
            dbBanner.imageUrl = webPath;
            dbBanner.image = webPath;
            dbBanner.placement = dbBanner.placement || 'Homepage Hero';
            await dbBanner.save();
          }
        }
      }
    }

    // Only assign positions to banners that don't have one
    let nextPos = 0;
    mockBanners.forEach((b) => {
      if (b.position === undefined || b.position === null) {
        b.position = nextPos;
      }
      nextPos = Math.max(nextPos, (b.position || 0) + 1);
    });
  } catch (err) {
    console.warn('Banner auto-detection warning:', err.message);
  }
}

// Automatically run on startup
syncAssetBanners();

// ── GET /api/banners/available-assets ──────────────────────────
// Admin/Public: get list of detected banner image assets
router.get('/available-assets', (req, res) => {
  try {
    const assets = [];
    const dirs = [
      { dir: path.join(__dirname, '../../frontend/assets/banners'), prefix: '/assets/banners/' },
      { dir: path.join(__dirname, '../../public/images/banners'), prefix: '/images/banners/' }
    ];

    const seen = new Set();
    dirs.forEach(({ dir, prefix }) => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(f => {
          const ext = path.extname(f).toLowerCase();
          if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) {
            const webPath = `${prefix}${f}`;
            if (!seen.has(f.toLowerCase())) {
              seen.add(f.toLowerCase());
              assets.push({
                filename: f,
                url: webPath,
                label: f.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '').toUpperCase()
              });
            }
          }
        });
      }
    });

    res.json({ success: true, count: assets.length, assets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/banners ───────────────────────────────────────────
// Public: get active banners (filtered by placement & schedule)
router.get('/', async (req, res) => {
  try {
    await syncAssetBanners();
    const { placement } = req.query;
    const now = new Date();

    if (!global.USE_MONGODB) {
      let banners = getMockBanners().filter(b => b.isActive !== false);

      if (placement) {
        banners = banners.filter(b => (b.placement || 'Homepage Hero') === placement);
      }

      // Filter by schedule if dates set
      banners = banners.filter(b => {
        if (b.scheduledStart && new Date(b.scheduledStart) > now) return false;
        if (b.scheduledEnd && new Date(b.scheduledEnd) < now) return false;
        return true;
      });

      banners.sort((a, b) => (a.position || 0) - (b.position || 0));
      return res.json({ success: true, banners });
    }

    const query = {
      isActive: true,
      $or: [{ scheduledStart: { $lte: now } }, { scheduledStart: null }],
      $or: [{ scheduledEnd: { $gte: now } }, { scheduledEnd: null }]
    };

    if (placement) {
      query.placement = placement;
    }

    const banners = await Banner.find(query).sort({ position: 1 });
    res.json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/banners/admin ─────────────────────────────────────
// Admin: get ALL banners including inactive/scheduled
router.get('/admin', protect, admin, async (req, res) => {
  try {
    await syncAssetBanners();
    const { placement } = req.query;

    if (!global.USE_MONGODB) {
      let banners = [...getMockBanners()];
      if (placement) {
        banners = banners.filter(b => (b.placement || 'Homepage Hero') === placement);
      }
      banners.sort((a, b) => (a.position || 0) - (b.position || 0));
      return res.json({ success: true, banners });
    }

    const query = {};
    if (placement) query.placement = placement;

    const banners = await Banner.find(query).sort({ position: 1 });
    res.json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/banners/upload ───────────────────────────────────
// Admin: upload banner image directly from computer
router.post('/upload', protect, admin, bannerUpload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    logAdminAction(req.user, 'BANNER_IMAGE_UPLOADED', 'BANNERS', `Uploaded banner image: ${req.file.filename}`);
    res.status(201).json({
      success: true,
      message: 'Banner image uploaded successfully!',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Banner upload failed: ' + err.message });
  }
});

// ── POST /api/banners/sync ─────────────────────────────────────
// Admin: trigger asset rescan manually
router.post('/sync', protect, admin, async (req, res) => {
  try {
    await syncAssetBanners();
    const banners = global.USE_MONGODB 
      ? await Banner.find().sort({ position: 1 })
      : [...getMockBanners()].sort((a, b) => (a.position || 0) - (b.position || 0));
    res.json({ success: true, message: 'Banner assets scanned and synchronized.', count: banners.length, banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/banners ──────────────────────────────────────────
// Admin: create new banner (Image or Video)
router.post('/', protect, admin, async (req, res) => {
  try {
    const { 
      title, 
      subtitle, 
      imageUrl, 
      mobileImageUrl, 
      mediaType = 'image',
      videoUrl = '',
      videoAutoplay = true,
      videoMuted = true,
      videoLoop = true,
      link, 
      cta, 
      placement = 'Homepage Hero', 
      position, 
      isActive, 
      scheduledStart, 
      scheduledEnd, 
      bgColor,
      badge
    } = req.body;

    const isVideo = mediaType === 'video' || (videoUrl && videoUrl.trim().length > 0);
    const finalImage = imageUrl || (isVideo ? '/assets/banners/whey-red-banner.png' : '');

    if (!finalImage && !videoUrl) {
      return res.status(400).json({ success: false, message: 'Banner image or video URL is required.' });
    }

    if (!global.USE_MONGODB) {
      const banners = getMockBanners();
      const maxPos = banners.reduce((max, b) => Math.max(max, b.position || 0), -1);
      const newBanner = {
        _id: 'ban_' + Date.now(),
        title: title || '',
        subtitle: subtitle || '',
        imageUrl: finalImage,
        image: finalImage,
        mobileImageUrl: mobileImageUrl || finalImage,
        mediaType: isVideo ? 'video' : 'image',
        videoUrl: videoUrl || '',
        videoAutoplay: videoAutoplay !== false,
        videoMuted: videoMuted !== false,
        videoLoop: videoLoop !== false,
        link: link || '#',
        buttonLink: link || '#',
        cta: cta || 'Shop Now',
        buttonText: cta || 'Shop Now',
        placement: placement || 'Homepage Hero',
        position: position !== undefined ? Number(position) : maxPos + 1,
        isActive: isActive !== false,
        scheduledStart: scheduledStart || null,
        scheduledEnd: scheduledEnd || null,
        bgColor: bgColor || '#000000',
        badge: badge || '',
        createdAt: new Date()
      };
      banners.push(newBanner);
      logAdminAction(req.user, 'BANNER_CREATED', 'BANNERS', `Created banner: ${newBanner.title}`, { bannerId: newBanner._id });
      return res.status(201).json({ success: true, message: 'Banner created.', banner: newBanner });
    }

    const banner = await Banner.create({
      title,
      subtitle,
      imageUrl: finalImage,
      image: finalImage,
      mobileImageUrl: mobileImageUrl || finalImage,
      mediaType: isVideo ? 'video' : 'image',
      videoUrl: videoUrl || '',
      videoAutoplay: videoAutoplay !== false,
      videoMuted: videoMuted !== false,
      videoLoop: videoLoop !== false,
      link: link || '#',
      buttonLink: link || '#',
      cta: cta || 'Shop Now',
      buttonText: cta || 'Shop Now',
      placement: placement || 'Homepage Hero',
      position: position !== undefined ? Number(position) : 0,
      isActive: isActive !== false,
      scheduledStart: scheduledStart || null,
      scheduledEnd: scheduledEnd || null,
      bgColor: bgColor || '#000000',
      badge: badge || ''
    });

    logAdminAction(req.user, 'BANNER_CREATED', 'BANNERS', `Created banner: ${banner.title}`, { bannerId: banner._id });
    res.status(201).json({ success: true, message: 'Banner created.', banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── PUT /api/banners/reorder ───────────────────────────────────
// Admin: reorder banners (pass array of { _id, position })
router.put('/reorder', protect, admin, async (req, res) => {
  try {
    const order = req.body.order || req.body.bannerOrders || (Array.isArray(req.body) ? req.body : null);
    if (!Array.isArray(order)) return res.status(400).json({ success: false, message: 'order must be an array.' });

    if (!global.USE_MONGODB) {
      const banners = getMockBanners();
      order.forEach((item, index) => {
        const bid = item._id || item.id;
        const pos = item.position !== undefined ? Number(item.position) : index;
        const b = banners.find(b => b._id === bid);
        if (b) b.position = pos;
      });
      banners.sort((a, b) => (a.position || 0) - (b.position || 0));
      return res.json({ success: true, message: 'Banners reordered.' });
    }

    for (let index = 0; index < order.length; index++) {
      const item = order[index];
      const bid = item._id || item.id;
      const pos = item.position !== undefined ? Number(item.position) : index;
      if (bid) {
        await Banner.findByIdAndUpdate(bid, { position: pos });
      }
    }
    res.json({ success: true, message: 'Banners reordered.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── PUT /api/banners/:id ───────────────────────────────────────
// Admin: update banner
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.imageUrl && !updateData.image) updateData.image = updateData.imageUrl;
    if (updateData.image && !updateData.imageUrl) updateData.imageUrl = updateData.image;
    if (updateData.cta && !updateData.buttonText) updateData.buttonText = updateData.cta;
    if (updateData.link && !updateData.buttonLink) updateData.buttonLink = updateData.link;

    if (!global.USE_MONGODB) {
      const banners = getMockBanners();
      const banner = banners.find(b => b._id === req.params.id);
      if (!banner) return res.status(404).json({ success: false, message: 'Banner not found.' });
      Object.assign(banner, updateData);
      logAdminAction(req.user, 'BANNER_UPDATED', 'BANNERS', `Updated banner: ${banner.title}`, { bannerId: banner._id });
      return res.json({ success: true, message: 'Banner updated.', banner });
    }

    const banner = await Banner.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found.' });
    logAdminAction(req.user, 'BANNER_UPDATED', 'BANNERS', `Updated banner: ${banner.title}`, { bannerId: banner._id });
    res.json({ success: true, message: 'Banner updated.', banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── DELETE /api/banners/:id ────────────────────────────────────
// Admin: delete banner
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    if (!global.USE_MONGODB) {
      const banners = getMockBanners();
      const idx = banners.findIndex(b => b._id === req.params.id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Banner not found.' });
      const [removed] = banners.splice(idx, 1);
      logAdminAction(req.user, 'BANNER_DELETED', 'BANNERS', `Deleted banner: ${removed.title}`, { bannerId: req.params.id });
      return res.json({ success: true, message: 'Banner deleted.' });
    }

    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found.' });
    logAdminAction(req.user, 'BANNER_DELETED', 'BANNERS', `Deleted banner: ${banner.title}`, { bannerId: req.params.id });
    res.json({ success: true, message: 'Banner deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/banners/bulk-clear - Admin: Permanently clear banners
router.post('/bulk-clear', protect, admin, async (req, res) => {
  try {
    const { bannerIds, scope } = req.body;
    let deletedCount = 0;

    if (Array.isArray(bannerIds) && bannerIds.length > 0) {
      const idStrings = bannerIds.map(String);
      if (!global.USE_MONGODB) {
        const banners = getMockBanners();
        const before = banners.length;
        mockDb.banners = banners.filter(b => !idStrings.includes(String(b._id)));
        deletedCount = before - mockDb.banners.length;
      } else {
        const resDel = await Banner.deleteMany({ _id: { $in: bannerIds } });
        deletedCount = resDel.deletedCount || 0;
      }
    } else if (scope === 'all') {
      if (!global.USE_MONGODB) {
        deletedCount = (mockDb.banners || []).length;
        mockDb.banners = [];
      } else {
        const resDel = await Banner.deleteMany({});
        deletedCount = resDel.deletedCount || 0;
      }
    }

    logAdminAction(req.user, 'BANNERS_BULK_CLEARED', 'BANNERS', `Bulk cleared ${deletedCount} banners`, { count: deletedCount, scope });
    res.json({ success: true, count: deletedCount, message: `Successfully cleared ${deletedCount} banner(s).` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear banners: ' + err.message });
  }
});

module.exports = router;