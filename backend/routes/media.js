const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');
const { logAdminAction } = require('../utils/adminLogger');
const mockDb = require('../utils/mockDb');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'img-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif|svg/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WEBP, GIF, SVG) are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

// GET /api/media - List all images in uploads folder
router.get('/', protect, admin, (req, res) => {
  try {
    const { search } = req.query;
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ success: true, files: [] });
    }

    const fileNames = fs.readdirSync(uploadsDir);
    let files = fileNames.map(name => {
      const filePath = path.join(uploadsDir, name);
      const stat = fs.statSync(filePath);
      return {
        filename: name,
        url: `/uploads/${name}`,
        size: stat.size,
        createdAt: stat.birthtime || stat.mtime
      };
    });

    if (search) {
      const q = search.toLowerCase();
      files = files.filter(f => f.filename.toLowerCase().includes(q));
    }

    files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, count: files.length, files });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list media: ' + err.message });
  }
});

// POST /api/media/upload - Upload single or multiple images
router.post('/upload', protect, admin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    logAdminAction(req.user, 'MEDIA_UPLOADED', 'MEDIA', `Uploaded media file: ${req.file.filename}`, { filename: req.file.filename, size: req.file.size });

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully!',
      file: {
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Upload failed: ' + err.message });
  }
});

// DELETE /api/media/:filename - Delete an uploaded file
router.delete('/:filename', protect, admin, (req, res) => {
  try {
    const filename = path.basename(req.params.filename); // prevent directory traversal
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    fs.unlinkSync(filePath);
    logAdminAction(req.user, 'MEDIA_DELETED', 'MEDIA', `Deleted media file: ${filename}`, { filename });

    res.json({ success: true, message: `Image ${filename} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed: ' + err.message });
  }
});

// POST /api/media/bulk-clear - Delete multiple media files
router.post('/bulk-clear', protect, admin, (req, res) => {
  try {
    const { filenames, scope } = req.body;
    let deletedCount = 0;

    if (Array.isArray(filenames) && filenames.length > 0) {
      filenames.forEach(f => {
        try {
          const safeName = path.basename(f);
          const p = path.join(uploadsDir, safeName);
          if (fs.existsSync(p)) {
            fs.unlinkSync(p);
            deletedCount++;
          }
        } catch (e) {}
      });
    } else if (scope === 'all') {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(f => {
        try {
          const p = path.join(uploadsDir, f);
          if (fs.statSync(p).isFile()) {
            fs.unlinkSync(p);
            deletedCount++;
          }
        } catch (e) {}
      });
    }

    logAdminAction(req.user, 'MEDIA_BULK_CLEARED', 'MEDIA', `Bulk deleted ${deletedCount} media files`, { count: deletedCount, scope });
    res.json({ success: true, count: deletedCount, message: `Successfully deleted ${deletedCount} media file(s).` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear media: ' + err.message });
  }
});

module.exports = router;
