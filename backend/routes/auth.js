const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const mockDb = require('../utils/mockDb');
const { protect } = require('../middleware/auth');

const generateToken = (userOrId) => {
  let payload;
  if (typeof userOrId === 'object' && userOrId !== null) {
    payload = {
      id: userOrId._id ? userOrId._id.toString() : userOrId.id,
      email: userOrId.email,
      role: userOrId.role,
      adminRole: userOrId.adminRole,
      name: userOrId.name
    };
  } else {
    payload = { id: String(userOrId) };
  }
  return jwt.sign(payload, process.env.JWT_SECRET || 'proteinx_jwt_secret_key_2024_change_me', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    if (!global.USE_MONGODB) {
      const existing = mockDb.users.find(u => u.email === email.toLowerCase());
      if (existing) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }
      const newUser = {
        _id: 'usr_' + Date.now(),
        name,
        email: email.toLowerCase(),
        passwordHash: bcrypt.hashSync(password, 10),
        phone: phone || '',
        role: 'user',
        addresses: [],
        isActive: true
      };
      mockDb.users.push(newUser);
      const token = generateToken(newUser);

      // Send welcome email alert
      try {
        const { sendEmail } = require('../services/emailService');
        sendEmail(newUser.email, 'welcome', {
          customerName: newUser.name,
          promoCode: 'FIRST10'
        }, { force: true }).catch(err => console.error('Welcome email dispatch error:', err));
      } catch (err) {
        console.error('Welcome email service error:', err);
      }

      return res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        token,
        user: { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({ name, email, password, phone });
    const token = generateToken(user);

    try {
      const { sendEmail } = require('../services/emailService');
      sendEmail(user.email, 'welcome', {
        customerName: user.name,
        promoCode: 'FIRST10'
      }, { force: true }).catch(err => console.error('Welcome email dispatch error:', err));
    } catch (err) {
      console.error('Welcome email service error:', err);
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (!global.USE_MONGODB) {
      const user = mockDb.users.find(u => u.email === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
      const token = generateToken(user);
      const isSuper = user.email === 'admin@proteinx.in' || user.email === 'kaziadnan275@gmail.com';
      const adminRole = user.adminRole || (isSuper ? 'super_admin' : 'staff');
      return res.json({
        success: true,
        message: 'Login successful!',
        token,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role, adminRole }
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    const isSuperDb = user.email === 'admin@proteinx.in' || user.email === 'kaziadnan275@gmail.com';
    const normalizedRole = (String(user.role).toLowerCase() === 'admin' || isSuperDb) ? 'admin' : (String(user.role).toLowerCase() || 'user');
    const adminRole = user.adminRole || (isSuperDb ? 'super_admin' : 'staff');
    const tokenUser = { ...(user.toObject ? user.toObject() : user), role: normalizedRole, adminRole };
    const token = generateToken(tokenUser);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: normalizedRole, adminRole }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

const { admin, superAdmin } = require('../middleware/admin');
const { logAdminAction } = require('../utils/adminLogger');

// GET /api/auth/users - Admin: Get all registered customers
router.get('/users', protect, admin, async (req, res) => {
  try {
    let customerList = [];
    if (!global.USE_MONGODB) {
      customerList = mockDb.users.map(u => {
        const userOrders = mockDb.orders.filter(o => String(o.user?._id || o.user) === String(u._id));
        const totalSpent = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        return {
          _id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          role: u.role,
          adminRole: u.adminRole,
          isActive: u.isActive !== false,
          orderCount: userOrders.length,
          totalSpent,
          createdAt: u.createdAt || '2026-01-15T10:00:00.000Z'
        };
      });
    } else {
      const users = await User.find().select('-password');
      customerList = users;
    }
    res.json({ success: true, count: customerList.length, users: customerList });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/auth/users/export - Admin: Export customers as CSV
router.get('/users/export', protect, admin, async (req, res) => {
  try {
    let usersData = [];
    if (!global.USE_MONGODB) {
      usersData = mockDb.users.map(u => {
        const userOrders = mockDb.orders.filter(o => String(o.user?._id || o.user) === String(u._id));
        const totalSpent = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        return {
          id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          role: u.role,
          adminRole: u.adminRole || '',
          status: u.isActive !== false ? 'Active' : 'Disabled',
          orderCount: userOrders.length,
          totalSpent,
          createdAt: u.createdAt || '2026-01-15'
        };
      });
    } else {
      const dbUsers = await User.find().select('-password');
      usersData = dbUsers.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        role: u.role,
        adminRole: u.adminRole || '',
        status: u.isActive ? 'Active' : 'Disabled',
        orderCount: 0,
        totalSpent: 0,
        createdAt: u.createdAt
      }));
    }

    const headers = ['Customer ID', 'Name', 'Email', 'Phone', 'Role', 'Admin Role', 'Status', 'Total Orders', 'Total Spent (INR)', 'Created At'];
    const rows = usersData.map(u => [
      `"${u.id}"`,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${(u.phone || '').replace(/"/g, '""')}"`,
      `"${u.role}"`,
      `"${u.adminRole || 'N/A'}"`,
      `"${u.status}"`,
      u.orderCount,
      u.totalSpent,
      `"${new Date(u.createdAt).toISOString().slice(0, 10)}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    logAdminAction(req.user, 'CUSTOMERS_EXPORTED', 'CUSTOMERS', 'Exported customer directory to CSV', { count: usersData.length });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="proteinx-customers-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Export failed: ' + err.message });
  }
});

// GET /api/auth/users/:id/orders - Admin: Get full order history for customer
router.get('/users/:id/orders', protect, admin, async (req, res) => {
  try {
    const userId = req.params.id;
    if (!global.USE_MONGODB) {
      const userOrders = mockDb.orders.filter(o => String(o.user?._id || o.user) === String(userId));
      return res.json({ success: true, count: userOrders.length, orders: userOrders });
    }
    const Order = require('../models/Order');
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// PUT /api/auth/users/:id/toggle - Admin: Activate or Deactivate customer
router.put('/users/:id/toggle', protect, admin, async (req, res) => {
  try {
    if (!global.USE_MONGODB) {
      const user = mockDb.users.find(u => String(u._id) === String(req.params.id));
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      user.isActive = user.isActive === false ? true : false;
      logAdminAction(req.user, 'USER_STATUS_TOGGLED', 'CUSTOMERS', `Toggled account status for ${user.email} (${user.isActive ? 'Active' : 'Deactivated'})`, { userId: user._id, isActive: user.isActive });
      return res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    logAdminAction(req.user, 'USER_STATUS_TOGGLED', 'CUSTOMERS', `Toggled account status for ${user.email} (${user.isActive ? 'Active' : 'Deactivated'})`, { userId: user._id, isActive: user.isActive });
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/auth/admins - Super Admin: Get all admin users and their roles
router.get('/admins', protect, superAdmin, async (req, res) => {
  try {
    if (!global.USE_MONGODB) {
      const admins = mockDb.users
        .filter(u => u.role === 'admin')
        .map(u => ({
          _id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          role: u.role,
          adminRole: u.adminRole || 'staff',
          isActive: u.isActive !== false,
          createdAt: u.createdAt || '2026-01-01'
        }));
      return res.json({ success: true, admins });
    }
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.json({ success: true, admins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/admins - Super Admin: Create a new admin/staff
router.post('/admins', protect, superAdmin, async (req, res) => {
  try {
    const { name, email, password, phone, adminRole } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }
    const validRoles = ['super_admin', 'admin', 'staff'];
    const chosenRole = validRoles.includes(adminRole) ? adminRole : 'staff';

    if (!global.USE_MONGODB) {
      const existing = mockDb.users.find(u => u.email === email.toLowerCase());
      if (existing) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }
      const newAdmin = {
        _id: 'usr_' + Date.now(),
        name,
        email: email.toLowerCase(),
        passwordHash: bcrypt.hashSync(password, 10),
        phone: phone || '',
        role: 'admin',
        adminRole: chosenRole,
        isActive: true,
        createdAt: new Date()
      };
      mockDb.users.push(newAdmin);
      logAdminAction(req.user, 'ADMIN_USER_CREATED', 'ROLES', `Created new admin ${email} with role ${chosenRole}`, { email, adminRole: chosenRole });
      return res.status(201).json({
        success: true,
        message: `Admin created with role: ${chosenRole}`,
        admin: { _id: newAdmin._id, name: newAdmin.name, email: newAdmin.email, role: newAdmin.role, adminRole: newAdmin.adminRole }
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }
    const newAdmin = await User.create({ name, email, password, phone, role: 'admin', adminRole: chosenRole });
    logAdminAction(req.user, 'ADMIN_USER_CREATED', 'ROLES', `Created new admin ${email} with role ${chosenRole}`, { email, adminRole: chosenRole });
    res.status(201).json({ success: true, message: `Admin created with role: ${chosenRole}`, admin: newAdmin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/auth/users/:id/role - Super Admin: Update admin role
router.put('/users/:id/role', protect, superAdmin, async (req, res) => {
  try {
    const { adminRole, role } = req.body;
    const validRoles = ['super_admin', 'admin', 'staff'];

    if (!global.USE_MONGODB) {
      const user = mockDb.users.find(u => String(u._id) === String(req.params.id));
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      if (role) user.role = role;
      if (adminRole && validRoles.includes(adminRole)) user.adminRole = adminRole;
      logAdminAction(req.user, 'ADMIN_ROLE_UPDATED', 'ROLES', `Updated permissions for ${user.email} to ${user.adminRole || user.role}`, { userId: user._id, adminRole: user.adminRole });
      return res.json({ success: true, message: 'Role updated successfully', user: { _id: user._id, name: user.name, email: user.email, role: user.role, adminRole: user.adminRole } });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (role) user.role = role;
    if (adminRole && validRoles.includes(adminRole)) user.adminRole = adminRole;
    await user.save();
    logAdminAction(req.user, 'ADMIN_ROLE_UPDATED', 'ROLES', `Updated permissions for ${user.email} to ${user.adminRole || user.role}`, { userId: user._id, adminRole: user.adminRole });
    res.json({ success: true, message: 'Role updated successfully', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const adminRole = req.user.adminRole || (req.user.email === 'admin@proteinx.in' || req.user.email === 'kaziadnan275@gmail.com' ? 'super_admin' : 'staff');
  res.json({ success: true, user: { ...req.user, adminRole } });
});

// POST /api/auth/users/bulk-clear - Admin: Permanently clear customer accounts (Preserving Admins)
router.post('/users/bulk-clear', protect, admin, async (req, res) => {
  try {
    const { userIds, scope, status } = req.body;
    let deletedCount = 0;

    const protectedEmails = ['admin@proteinx.in', 'kaziadnan275@gmail.com'];

    if (Array.isArray(userIds) && userIds.length > 0) {
      const idStrings = userIds.map(String);
      if (!global.USE_MONGODB) {
        const before = mockDb.users.length;
        mockDb.users = mockDb.users.filter(u => {
          if (u.role === 'admin' || protectedEmails.includes(u.email)) return true;
          return !idStrings.includes(String(u._id));
        });
        deletedCount = before - mockDb.users.length;
      } else {
        const resDel = await User.deleteMany({
          _id: { $in: userIds },
          role: { $ne: 'admin' },
          email: { $nin: protectedEmails }
        });
        deletedCount = resDel.deletedCount || 0;
      }
    } else if (scope === 'all') {
      if (!global.USE_MONGODB) {
        const before = mockDb.users.length;
        mockDb.users = mockDb.users.filter(u => u.role === 'admin' || protectedEmails.includes(u.email));
        deletedCount = before - mockDb.users.length;
      } else {
        const resDel = await User.deleteMany({
          role: { $ne: 'admin' },
          email: { $nin: protectedEmails }
        });
        deletedCount = resDel.deletedCount || 0;
      }
    } else {
      if (!global.USE_MONGODB) {
        const before = mockDb.users.length;
        mockDb.users = mockDb.users.filter(u => {
          if (u.role === 'admin' || protectedEmails.includes(u.email)) return true;
          if (status === 'disabled') return u.isActive !== false;
          return true;
        });
        deletedCount = before - mockDb.users.length;
      } else {
        const q = { role: { $ne: 'admin' }, email: { $nin: protectedEmails } };
        if (status === 'disabled') q.isActive = false;
        const resDel = await User.deleteMany(q);
        deletedCount = resDel.deletedCount || 0;
      }
    }

    logAdminAction(req.user, 'USERS_BULK_CLEARED', 'CUSTOMERS', `Bulk cleared ${deletedCount} customer accounts (scope: ${scope || 'selected'})`, { count: deletedCount, scope });
    res.json({ success: true, count: deletedCount, message: `Successfully cleared ${deletedCount} customer account(s).` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear customers: ' + err.message });
  }
});

module.exports = router;