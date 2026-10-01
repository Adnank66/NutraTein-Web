const express = require('express');
const router = express.Router();
const mockDb = require('../utils/mockDb');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');
const { logAdminAction } = require('../utils/adminLogger');

// ── Super Admin check (only role: 'admin' for now, extendable) ──
function requireSuperAdmin(req, res, next) {
  const user = req.user;
  // Accept adminRole === 'super_admin' or the designated admin email
  if (user && (user.adminRole === 'super_admin' || user.email === (process.env.ADMIN_EMAIL || 'admin@proteinx.in'))) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Super Admin access required for backup/restore.' });
}

// ── GET /api/backup/export ──────────────────────────────────────
// Super Admin only: export all app data (NO passwords, NO SMTP credentials)
router.get('/export', protect, admin, requireSuperAdmin, (req, res) => {
  try {
    // Scrub sensitive data
    const safeUsers = (mockDb.users || []).map(u => {
      const { passwordHash, password, ...safeUser } = u;
      return safeUser;
    });

    const safeSettings = JSON.parse(JSON.stringify(mockDb.storeSettings || {}));
    // Remove SMTP password from backup
    if (safeSettings.emailSettings) {
      delete safeSettings.emailSettings.smtpPass;
    }

    const backup = {
      meta: {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        exportedBy: req.user.email,
        note: 'Passwords and SMTP credentials are excluded for security. Import this file on the same PROTEINX installation.'
      },
      data: {
        products: mockDb.products || [],
        categories: mockDb.categories || [],
        orders: mockDb.orders || [],
        users: safeUsers,
        coupons: mockDb.coupons || [],
        banners: mockDb.banners || [],
        reviews: mockDb.reviews || [],
        flashSales: mockDb.flashSales || [],
        returns: mockDb.returns || [],
        storeSettings: safeSettings,
        adminLogs: (mockDb.adminLogs || []).slice(0, 200) // Last 200 logs
      }
    };

    logAdminAction(req.user, 'BACKUP_EXPORTED', 'BACKUP', 'Full store data backup exported', {});

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="proteinx-backup-${new Date().toISOString().slice(0, 10)}.json"`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, message: 'Backup failed: ' + err.message });
  }
});

// ── POST /api/backup/import ─────────────────────────────────────
// Super Admin only: restore from backup JSON
router.post('/import', protect, admin, requireSuperAdmin, express.json({ limit: '50mb' }), (req, res) => {
  try {
    // Require explicit confirmation header to prevent accidental restore
    const confirmHeader = req.headers['x-confirm-restore'];
    if (confirmHeader !== 'CONFIRM') {
      return res.status(400).json({
        success: false,
        message: 'Restore requires confirmation. Set header X-Confirm-Restore: CONFIRM'
      });
    }

    const backup = req.body;
    if (!backup || !backup.data || !backup.meta) {
      return res.status(400).json({ success: false, message: 'Invalid backup file format.' });
    }

    const { data } = backup;

    // Restore each collection (preserve current passwords since they're not in backup)
    if (data.products) mockDb.products.length = 0, data.products.forEach(p => mockDb.products.push(p));
    if (data.categories) mockDb.categories.length = 0, data.categories.forEach(c => mockDb.categories.push(c));
    if (data.orders) mockDb.orders.length = 0, data.orders.forEach(o => mockDb.orders.push(o));
    if (data.coupons) mockDb.coupons.length = 0, data.coupons.forEach(c => mockDb.coupons.push(c));
    if (data.banners) mockDb.banners.length = 0, data.banners.forEach(b => mockDb.banners.push(b));
    if (data.flashSales) mockDb.flashSales.length = 0, data.flashSales.forEach(f => mockDb.flashSales.push(f));
    if (data.returns) mockDb.returns.length = 0, data.returns.forEach(r => mockDb.returns.push(r));

    // Reviews — use if available
    if (data.reviews) {
      if (!mockDb.reviews) mockDb.reviews = [];
      mockDb.reviews.length = 0;
      data.reviews.forEach(r => mockDb.reviews.push(r));
    }

    // Restore settings but preserve SMTP password
    if (data.storeSettings) {
      const existingSmtpPass = mockDb.storeSettings.emailSettings && mockDb.storeSettings.emailSettings.smtpPass;
      Object.assign(mockDb.storeSettings, data.storeSettings);
      // Re-apply SMTP password
      if (existingSmtpPass && mockDb.storeSettings.emailSettings) {
        mockDb.storeSettings.emailSettings.smtpPass = existingSmtpPass;
      }
    }

    // Restore users but preserve current password hashes
    if (data.users) {
      const existingPasswords = {};
      mockDb.users.forEach(u => { existingPasswords[u._id] = u.passwordHash || u.password; });
      mockDb.users.length = 0;
      data.users.forEach(u => {
        mockDb.users.push({ ...u, passwordHash: existingPasswords[u._id] || u.passwordHash });
      });
    }

    logAdminAction(req.user, 'BACKUP_RESTORED', 'BACKUP', `Store data restored from backup (exported: ${backup.meta.exportedAt})`, { exportedAt: backup.meta.exportedAt });

    res.json({
      success: true,
      message: 'Backup restored successfully! The store is now running with restored data.',
      exportedAt: backup.meta.exportedAt
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Restore failed: ' + err.message });
  }
});

module.exports = router;
