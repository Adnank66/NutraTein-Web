const express = require('express');
const router = express.Router();
const AdminLog = require('../models/AdminLog');
const mockDb = require('../utils/mockDb');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');

// GET /api/activity-logs - Admin read-only audit log
router.get('/', protect, admin, async (req, res) => {
  try {
    const { search = '', module = 'all', dateRange = 'all', page = 1, limit = 50 } = req.query;

    let logsList = [];
    if (!global.USE_MONGODB) {
      logsList = [...mockDb.adminLogs];
    } else {
      logsList = await AdminLog.find().populate('adminId', 'name email').sort({ createdAt: -1 });
    }

    let enriched = logsList.map(l => {
      const plain = l.toObject ? l.toObject() : { ...l };
      return {
        _id: plain._id,
        action: plain.action,
        module: plain.module,
        description: plain.description,
        details: plain.details || {},
        admin: typeof plain.adminId === 'object' && plain.adminId ? (plain.adminId.name || plain.adminId.email) : (plain.adminId || 'Super Admin'),
        ip: plain.ip || '127.0.0.1',
        createdAt: plain.createdAt
      };
    });

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      enriched = enriched.filter(l =>
        (l.description && l.description.toLowerCase().includes(q)) ||
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.module && l.module.toLowerCase().includes(q)) ||
        (l.admin && l.admin.toLowerCase().includes(q))
      );
    }

    // Module filter
    if (module && module !== 'all') {
      enriched = enriched.filter(l => l.module.toUpperCase() === module.toUpperCase());
    }

    // Date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let days = 0;
      if (dateRange === 'today') days = 1;
      else if (dateRange === '7days') days = 7;
      else if (dateRange === '30days') days = 30;

      if (days > 0) {
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        enriched = enriched.filter(l => new Date(l.createdAt) >= cutoff);
      }
    }

    // Pagination
    const totalCount = enriched.length;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.min(100, Math.max(10, parseInt(limit) || 50));
    const paginated = enriched.slice((pageNum - 1) * pageSize, pageNum * pageSize);

    // Module count stats
    const moduleCounts = {};
    ['ORDERS', 'COUPONS', 'PRODUCTS', 'SHIPPING', 'AUTH'].forEach(m => {
      moduleCounts[m] = logsList.filter(l => (l.module || '').toUpperCase() === m).length;
    });

    res.json({
      success: true,
      logs: paginated,
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / pageSize),
      moduleCounts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/activity-logs/export/csv - Export audit logs as CSV
router.get('/export/csv', protect, admin, async (req, res) => {
  try {
    const { module = 'all', dateRange = 'all' } = req.query;
    let list = !global.USE_MONGODB ? [...mockDb.adminLogs] : await AdminLog.find().populate('adminId', 'name email').sort({ createdAt: -1 });

    if (module && module !== 'all') {
      list = list.filter(l => (l.module || '').toUpperCase() === module.toUpperCase());
    }
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let days = 0;
      if (dateRange === 'today') days = 1;
      else if (dateRange === '7days') days = 7;
      else if (dateRange === '30days') days = 30;
      if (days > 0) {
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        list = list.filter(l => new Date(l.createdAt) >= cutoff);
      }
    }

    const headers = ['Timestamp', 'Administrator', 'Module', 'Action', 'Description', 'Details'];
    const rows = list.map(l => {
      const adminName = typeof l.adminId === 'object' && l.adminId ? (l.adminId.name || l.adminId.email) : (l.adminId || 'Super Admin');
      return [
        `"${new Date(l.createdAt).toISOString()}"`,
        `"${String(adminName).replace(/"/g, '""')}"`,
        `"${l.module || ''}"`,
        `"${l.action || ''}"`,
        `"${(l.description || '').replace(/"/g, '""')}"`,
        `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="nutratein-audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Export failed: ' + err.message });
  }
});

// POST /api/activity-logs/bulk-clear - Admin: Clear activity logs
router.post('/bulk-clear', protect, admin, async (req, res) => {
  try {
    const { scope, module, dateRange } = req.body;
    let deletedCount = 0;

    if (!global.USE_MONGODB) {
      if (scope === 'all' || (!module && !dateRange)) {
        deletedCount = (mockDb.adminLogs || []).length;
        mockDb.adminLogs = [];
      } else {
        const before = mockDb.adminLogs.length;
        mockDb.adminLogs = (mockDb.adminLogs || []).filter(l => {
          if (module && module !== 'all' && (l.module || '').toUpperCase() === module.toUpperCase()) return false;
          return true;
        });
        deletedCount = before - mockDb.adminLogs.length;
      }
    } else {
      const q = {};
      if (module && module !== 'all') q.module = module.toUpperCase();
      const resDel = await AdminLog.deleteMany(q);
      deletedCount = resDel.deletedCount || 0;
    }

    res.json({ success: true, count: deletedCount, message: `Successfully cleared ${deletedCount} activity log(s).` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear activity logs: ' + err.message });
  }
});

module.exports = router;

