const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mockDb = require('../utils/mockDb');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');
const { logAdminAction } = require('../utils/adminLogger');

// Multer Storage Configuration for Videos and Video Posters
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) {}
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `video_${Date.now()}_${cleanBase}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.mp4', '.webm', '.ogg', '.mov', '.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only video files (.mp4, .webm, .ogg) and poster images are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

// Helper to access storeVideos safely
function getVideosDb() {
  if (!mockDb.storeVideos) {
    mockDb.storeVideos = {
      heroVideo: {
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-working-out-with-dumbbells-in-a-gym-44143-large.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1600&auto=format&fit=crop&q=80',
        title: 'PURE POWER. ZERO COMPROMISE.',
        subtitle: 'Ultra-filtered Whey Isolate packing 27g pure protein, 6.2g BCAAs, and zero added sugar.',
        badge: '🔥 PREMIUM WHEY COLLECTION',
        ctaPrimaryText: 'SHOP WHEY ISOLATE',
        ctaPrimaryLink: 'shop.html?category=whey-protein',
        ctaSecondaryText: 'EXPLORE ALL PRODUCTS',
        ctaSecondaryLink: 'shop.html',
        active: false,
        autoplay: true,
        loop: true,
        muted: true
      },
      productShowcaseVideo: {
        videoUrl: '/assets/videos/Protein_tub_spinning_video.mp4',
        posterUrl: '/assets/videos/protein_tub_poster.jpg',
        title: 'NUTRATEIN 100% Whey Isolate (2.2kg / 5lbs)',
        badgeText: '360° 3D PRODUCT VIEW',
        tagline: 'ULTRA-LEAN MUSCLE FORMULA',
        proteinGrams: '27g',
        bcaaGrams: '6.2g',
        sugarGrams: '0g',
        purityPercent: '99.4%',
        active: true,
        autoplay: true,
        loop: true,
        muted: true
      },
      fitnessVideos: []
    };
  } else if (!mockDb.storeVideos.productShowcaseVideo) {
    mockDb.storeVideos.productShowcaseVideo = {
      videoUrl: '/assets/videos/Protein_tub_spinning_video.mp4',
      posterUrl: '/assets/videos/protein_tub_poster.jpg',
      title: 'NUTRATEIN 100% Whey Isolate (2.2kg / 5lbs)',
      badgeText: '360° 3D PRODUCT VIEW',
      tagline: 'ULTRA-LEAN MUSCLE FORMULA',
      proteinGrams: '27g',
      bcaaGrams: '6.2g',
      sugarGrams: '0g',
      purityPercent: '99.4%',
      active: true,
      autoplay: true,
      loop: true,
      muted: true
    };
  }
  return mockDb.storeVideos;
}

// ─── 1. PUBLIC: GET /api/videos ──────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const vdb = getVideosDb();
    const hero = vdb.heroVideo && vdb.heroVideo.active ? vdb.heroVideo : null;
    const showcase = vdb.productShowcaseVideo && vdb.productShowcaseVideo.active ? vdb.productShowcaseVideo : null;
    const fitness = (vdb.fitnessVideos || [])
      .filter(v => v.active !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    res.json({
      success: true,
      heroVideo: hero,
      productShowcaseVideo: showcase,
      fitnessVideos: fitness
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 2. ADMIN: GET /api/videos/admin ─────────────────────────────────
router.get('/admin', protect, admin, (req, res) => {
  try {
    const vdb = getVideosDb();
    res.json({
      success: true,
      heroVideo: vdb.heroVideo,
      productShowcaseVideo: vdb.productShowcaseVideo,
      fitnessVideos: vdb.fitnessVideos || []
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 3. ADMIN: PUT /api/videos/hero ──────────────────────────────────
router.put('/hero', protect, admin, (req, res) => {
  try {
    const vdb = getVideosDb();
    const {
      videoUrl, posterUrl, title, subtitle, badge,
      ctaPrimaryText, ctaPrimaryLink, ctaSecondaryText, ctaSecondaryLink,
      active, autoplay, loop, muted
    } = req.body;

    vdb.heroVideo = {
      ...vdb.heroVideo,
      ...(videoUrl !== undefined && { videoUrl }),
      ...(posterUrl !== undefined && { posterUrl }),
      ...(title !== undefined && { title }),
      ...(subtitle !== undefined && { subtitle }),
      ...(badge !== undefined && { badge }),
      ...(ctaPrimaryText !== undefined && { ctaPrimaryText }),
      ...(ctaPrimaryLink !== undefined && { ctaPrimaryLink }),
      ...(ctaSecondaryText !== undefined && { ctaSecondaryText }),
      ...(ctaSecondaryLink !== undefined && { ctaSecondaryLink }),
      ...(active !== undefined && { active: Boolean(active) }),
      ...(autoplay !== undefined && { autoplay: Boolean(autoplay) }),
      ...(loop !== undefined && { loop: Boolean(loop) }),
      ...(muted !== undefined && { muted: Boolean(muted) }),
      updatedAt: new Date()
    };

    logAdminAction(req.user, 'VIDEOS', 'UPDATE_HERO', 'Updated cinematic hero background video configuration');

    res.json({
      success: true,
      message: 'Hero video configuration updated successfully',
      heroVideo: vdb.heroVideo
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 3B. ADMIN: PUT /api/videos/product-showcase ─────────────────────
router.put('/product-showcase', protect, admin, (req, res) => {
  try {
    const vdb = getVideosDb();
    const {
      videoUrl, posterUrl, title, badgeText, tagline,
      proteinGrams, bcaaGrams, sugarGrams, purityPercent,
      active, autoplay, loop, muted
    } = req.body;

    vdb.productShowcaseVideo = {
      ...vdb.productShowcaseVideo,
      ...(videoUrl !== undefined && { videoUrl }),
      ...(posterUrl !== undefined && { posterUrl }),
      ...(title !== undefined && { title }),
      ...(badgeText !== undefined && { badgeText }),
      ...(tagline !== undefined && { tagline }),
      ...(proteinGrams !== undefined && { proteinGrams }),
      ...(bcaaGrams !== undefined && { bcaaGrams }),
      ...(sugarGrams !== undefined && { sugarGrams }),
      ...(purityPercent !== undefined && { purityPercent }),
      ...(active !== undefined && { active: Boolean(active) }),
      ...(autoplay !== undefined && { autoplay: Boolean(autoplay) }),
      ...(loop !== undefined && { loop: Boolean(loop) }),
      ...(muted !== undefined && { muted: Boolean(muted) }),
      updatedAt: new Date()
    };

    logAdminAction(req.user, 'VIDEOS', 'UPDATE_PRODUCT_SHOWCASE', 'Updated 3D spinning protein tub showcase video');

    res.json({
      success: true,
      message: '3D Product showcase video configuration updated successfully',
      productShowcaseVideo: vdb.productShowcaseVideo
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 4. ADMIN: POST /api/videos/fitness ──────────────────────────────
router.post('/fitness', protect, admin, (req, res) => {
  try {
    const vdb = getVideosDb();
    const { title, tag, category, videoUrl, posterUrl, description, duration, ctaText, ctaLink, sortOrder, active } = req.body;

    if (!title || !videoUrl) {
      return res.status(400).json({ success: false, message: 'Title and Video URL are required' });
    }

    const newVideo = {
      id: 'vid_' + Date.now(),
      title: title.trim(),
      tag: (tag || 'PERFORMANCE').trim(),
      category: category || 'whey-protein',
      videoUrl: videoUrl.trim(),
      posterUrl: posterUrl ? posterUrl.trim() : '',
      description: description ? description.trim() : '',
      duration: duration || '0:30',
      ctaText: ctaText || 'SHOP NOW →',
      ctaLink: ctaLink || 'shop.html',
      sortOrder: Number(sortOrder) || ((vdb.fitnessVideos.length || 0) + 1),
      active: active !== false,
      createdAt: new Date()
    };

    vdb.fitnessVideos.push(newVideo);

    logAdminAction(req.user, 'VIDEOS', 'ADD_FITNESS', `Added fitness showcase video: ${newVideo.title}`);

    res.status(201).json({
      success: true,
      message: 'Fitness showcase video added successfully',
      video: newVideo
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 5. ADMIN: PUT /api/videos/fitness/:id ───────────────────────────
router.put('/fitness/:id', protect, admin, (req, res) => {
  try {
    const vdb = getVideosDb();
    const idx = (vdb.fitnessVideos || []).findIndex(v => v.id === req.params.id || v._id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const current = vdb.fitnessVideos[idx];
    const { title, tag, category, videoUrl, posterUrl, description, duration, ctaText, ctaLink, sortOrder, active } = req.body;

    vdb.fitnessVideos[idx] = {
      ...current,
      ...(title !== undefined && { title: title.trim() }),
      ...(tag !== undefined && { tag: tag.trim() }),
      ...(category !== undefined && { category }),
      ...(videoUrl !== undefined && { videoUrl: videoUrl.trim() }),
      ...(posterUrl !== undefined && { posterUrl: posterUrl.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(duration !== undefined && { duration }),
      ...(ctaText !== undefined && { ctaText }),
      ...(ctaLink !== undefined && { ctaLink }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      ...(active !== undefined && { active: Boolean(active) }),
      updatedAt: new Date()
    };

    logAdminAction(req.user, 'VIDEOS', 'UPDATE_FITNESS', `Updated fitness video: ${vdb.fitnessVideos[idx].title}`);

    res.json({
      success: true,
      message: 'Fitness showcase video updated successfully',
      video: vdb.fitnessVideos[idx]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 6. ADMIN: DELETE /api/videos/fitness/:id ────────────────────────
router.delete('/fitness/:id', protect, admin, (req, res) => {
  try {
    const vdb = getVideosDb();
    const idx = (vdb.fitnessVideos || []).findIndex(v => v.id === req.params.id || v._id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const removed = vdb.fitnessVideos.splice(idx, 1)[0];
    logAdminAction(req.user, 'VIDEOS', 'DELETE_FITNESS', `Deleted fitness showcase video: ${removed.title}`);

    res.json({
      success: true,
      message: 'Fitness video deleted successfully',
      deletedId: req.params.id
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 7. ADMIN: POST /api/videos/upload ───────────────────────────────
router.post('/upload', protect, admin, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    logAdminAction(req.user, 'MEDIA', 'UPLOAD_VIDEO', `Uploaded video asset: ${req.file.filename}`);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      fileUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  });
});

module.exports = router;
