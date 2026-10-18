// Admin-only route protection (use AFTER protect middleware)
const admin = (req, res, next) => {
  const role = (req.user && req.user.role) ? String(req.user.role).toLowerCase() : '';
  if (role === 'admin' || role === 'super_admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Admin access required.' });
};

// Super Admin check
const superAdmin = (req, res, next) => {
  const role = (req.user && req.user.role) ? String(req.user.role).toLowerCase() : '';
  if (role !== 'admin' && role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  const isSuper = req.user.adminRole === 'super_admin' || role === 'super_admin';
  if (isSuper) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Super Admin access required for this action.' });
};

// Granular role checker: e.g. requireRole(['super_admin', 'admin'])
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const role = (req.user && req.user.role) ? String(req.user.role).toLowerCase() : '';
    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const currentRole = req.user.adminRole || (role === 'super_admin' ? 'super_admin' : 'staff');
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
