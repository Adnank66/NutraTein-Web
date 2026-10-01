const AdminLog = require('../models/AdminLog');
const mockDb = require('./mockDb');

async function logAdminAction({ action, module, description, details = {}, adminId = 'u_admin', ip = '' }) {
  try {
    const entry = {
      action,
      module,
      description,
      details,
      adminId,
      ip,
      createdAt: new Date()
    };

    if (global.USE_MONGODB) {
      await AdminLog.create(entry);
    } else {
      mockDb.logAdminAction(entry);
    }
  } catch (err) {
    console.error('Failed to write admin log:', err.message);
  }
}

module.exports = { logAdminAction };
