const ADMIN_EMAILS = [
  'kaziadnan275@gmail.com',
  (process.env.ADMIN_EMAIL || 'kaziadnan275@gmail.com').toLowerCase(),
  'admin@proteinx.in'
];

// Admin-only route protection (use AFTER protect middleware)
const admin = (req, res, next) => {
  const role = (req.user && req.user.role) ? String(req.user.role).toLowerCase() : '';
  const email = (req.user && req.user.email) ? String(req.user.email).toLowerCase() : '';
  if (role === 'admin' || ADMIN_EMAILS.includes(email)) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Admin access required.' });
};

// Super Admin check
const superAdmin = (req, res, next) => {
  const role = (req.user && req.user.role) ? String(req.user.role).toLowerCase() : '';
  const email = (req.user && req.user.email) ? String(req.user.email).toLowerCase() : '';
  if (role !== 'admin' && !ADMIN_EMAILS.includes(email)) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  const isSuper = req.user.adminRole === 'super_admin' || ADMIN_EMAILS.includes(email);
  if (isSuper) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Super Admin access required for this action.' });
};

// Granular role checker: e.g. requireRole(['super_admin', 'admin'])
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const role = (req.user && req.user.role) ? String(req.user.role).toLowerCase() : '';
    const email = (req.user && req.user.email) ? String(req.user.email).toLowerCase() : '';
    if (role !== 'admin' && !ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const currentRole = req.user.adminRole || (ADMIN_EMAILS.includes(email) ? 'super_admin' : 'staff');
    if (currentRole === 'super_admin' || allowedRoles.includes(currentRole)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `Permission denied. Required role: ${allowedRoles.join(' or ')} (Current: ${currentRole})`
    });
  };
};

module.exports = admin;
module.exports.admin = admin;
module.exports.superAdmin = superAdmin;
module.exports.requireRole = requireRole;