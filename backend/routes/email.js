const express = require('express');
const router = express.Router();
const mockDb = require('../utils/mockDb');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');
const { sendEmail, retryEmail } = require('../services/emailService');
const { logAdminAction } = require('../utils/adminLogger');

// ─── Helper: get emailSettings safely ─────────────────────────
function getEmailSettings() {
  if (!mockDb.storeSettings.emailSettings) {
    mockDb.storeSettings.emailSettings = {
      smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '',
      senderName: 'NUTRATEIN', senderEmail: 'kaziadnan275@gmail.com', enabled: true
    };
  }
  return mockDb.storeSettings.emailSettings;
}

function getEmailNotifications() {
  if (!mockDb.storeSettings.emailNotifications) {
    mockDb.storeSettings.emailNotifications = {
      order_placed: true,
      order_shipped: true,
      order_delivered: true,
      order_cancelled: true,
      welcome: true,
      lowStock: true,
      returnApproved: true,
      returnRejected: true
    };
  }
  return mockDb.storeSettings.emailNotifications;
}

function getEmailTemplates() {
  if (!mockDb.storeSettings.emailTemplates) {
    mockDb.storeSettings.emailTemplates = {
      order_placed: {
        subject: 'Your NUTRATEIN Order #{{orderNumber}} is Confirmed!',
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
<h2 style="color:#D9651E;">Order Confirmed ✅</h2>
<p>Hi <strong>{{customerName}}</strong>,</p>
<p>Thank you for your order! We've received <strong>Order #{{orderNumber}}</strong> for <strong>₹{{amount}}</strong>.</p>
<p>Your order is being processed and will be shipped within <strong>{{processingDays}} business day(s)</strong>.</p>
<p>Expected delivery: <strong>{{deliveryDate}}</strong></p>
<hr><p style="color:#888;font-size:12px;">NUTRATEIN Sports Nutrition | kaziadnan275@gmail.com</p></div>`
      },
      order_shipped: {
        subject: 'Your Order #{{orderNumber}} Has Been Shipped! 🚚',
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
<h2 style="color:#D9651E;">Order Shipped 🚀</h2>
<p>Hi <strong>{{customerName}}</strong>,</p>
<p>Great news! Your order <strong>#{{orderNumber}}</strong> has been shipped via <strong>{{courier}}</strong>.</p>
<p>Tracking ID: <strong>{{trackingId}}</strong></p>
<p>Expected delivery: <strong>{{deliveryDate}}</strong></p>
<hr><p style="color:#888;font-size:12px;">NUTRATEIN Sports Nutrition | kaziadnan275@gmail.com</p></div>`
      },
      order_delivered: {
        subject: 'Your Order #{{orderNumber}} Has Been Delivered! 🎉',
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
<h2 style="color:#D9651E;">Order Delivered 🎉</h2>
<p>Hi <strong>{{customerName}}</strong>,</p>
<p>Your order <strong>#{{orderNumber}}</strong> has been delivered. We hope you love your NUTRATEIN products!</p>
<p>Please leave a review to help others make the right choice.</p>
<hr><p style="color:#888;font-size:12px;">NUTRATEIN Sports Nutrition | kaziadnan275@gmail.com</p></div>`
      },
      order_cancelled: {
        subject: 'Your Order #{{orderNumber}} Has Been Cancelled',
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
<h2 style="color:#D9651E;">Order Cancelled</h2>
<p>Hi <strong>{{customerName}}</strong>,</p>
<p>Your order <strong>#{{orderNumber}}</strong> has been cancelled. Any payment will be refunded within 5-7 business days.</p>
<hr><p style="color:#888;font-size:12px;">NUTRATEIN Sports Nutrition | kaziadnan275@gmail.com</p></div>`
      },
      welcome: {
        subject: 'Welcome to NUTRATEIN! 💪',
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
<h2 style="color:#D9651E;">Welcome, {{customerName}}! 💪</h2>
<p>You've joined the NUTRATEIN family! Use code <strong>FIRST10</strong> for 10% off your first order.</p>
<hr><p style="color:#888;font-size:12px;">NUTRATEIN Sports Nutrition | kaziadnan275@gmail.com</p></div>`
      },
      lowStock: {
        subject: '⚠️ Low Stock Alert: {{productName}}',
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
<h2 style="color:#D9651E;">Low Stock Alert ⚠️</h2>
<p><strong>{{productName}}</strong> is running low!</p>
<p>Current stock: <strong>{{currentStock}}</strong> units (threshold: {{threshold}})</p>
<p>Please restock immediately to avoid stockouts.</p>
<hr><p style="color:#888;font-size:12px;">NUTRATEIN Admin Panel</p></div>`
      },
      returnApproved: {
        subject: 'Your Return Request #{{returnId}} Has Been Approved',
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
<h2 style="color:#D9651E;">Return Approved ✅</h2>
<p>Hi <strong>{{customerName}}</strong>, your return for Order <strong>#{{orderNumber}}</strong> has been approved.</p>
<p>Refund will be processed within 5-7 business days.</p>
<hr><p style="color:#888;font-size:12px;">NUTRATEIN Sports Nutrition | kaziadnan275@gmail.com</p></div>`
      },
      returnRejected: {
        subject: 'Your Return Request #{{returnId}} Could Not Be Approved',
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
<h2 style="color:#D9651E;">Return Update</h2>
<p>Hi <strong>{{customerName}}</strong>, unfortunately your return for Order <strong>#{{orderNumber}}</strong> could not be approved.</p>
<p>Reason: {{reason}}</p>
<p>Please contact support for further assistance.</p>
<hr><p style="color:#888;font-size:12px;">NUTRATEIN Sports Nutrition | kaziadnan275@gmail.com</p></div>`
      }
    };
  }
  return mockDb.storeSettings.emailTemplates;
}

// ── GET /api/email/settings ─────────────────────────────────────
router.get('/settings', protect, admin, (req, res) => {
  const cfg = getEmailSettings();
  // Mask password in response
  res.json({
    success: true,
    settings: {
      smtpHost: cfg.smtpHost,
      smtpPort: cfg.smtpPort,
      smtpUser: cfg.smtpUser,
      smtpPassSet: !!(cfg.smtpPass),  // only indicate if set
      senderName: cfg.senderName,
      senderEmail: cfg.senderEmail,
      enabled: cfg.enabled
    }
  });
});

// ── PUT /api/email/settings ─────────────────────────────────────
router.put('/settings', protect, admin, (req, res) => {
  const cfg = getEmailSettings();
  const allowed = ['smtpHost', 'smtpPort', 'smtpUser', 'senderName', 'senderEmail', 'enabled'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) cfg[key] = req.body[key];
  }
  // Only update password if explicitly provided and non-empty
  if (req.body.smtpPass && req.body.smtpPass !== '••••••••') {
    cfg.smtpPass = req.body.smtpPass;
  }
  logAdminAction(req.user, 'EMAIL_SETTINGS_UPDATED', 'EMAIL', 'Updated email SMTP settings', {});
  res.json({ success: true, message: 'Email settings saved.' });
});

// ── POST /api/email/test ────────────────────────────────────────
router.post('/test', protect, admin, async (req, res) => {
  try {
    const cfg = getEmailSettings();
    const testTo = (req.body.to && req.body.to.trim()) || cfg.senderEmail || req.user.email;
    const templateKey = req.body.templateName || 'welcome';
    const templates = getEmailTemplates();
    const tpl = templates[templateKey] || templates.welcome || {
      subject: '✅ NUTRATEIN Email Test',
      html: '<p>Test email payload</p>'
    };

    const sampleVars = {
      customerName: req.user?.name || 'Athletic Member',
      orderNumber: 'NUT' + Math.floor(100000 + Math.random() * 900000),
      amount: '3,499',
      processingDays: '1',
      deliveryDate: new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      courier: 'Blue Dart Express',
      trackingId: 'BD' + Math.floor(100000000 + Math.random() * 900000000) + 'IN',
      productName: '100% Gold Standard Whey Isolate',
      currentStock: '4',
      threshold: '10',
      returnId: 'RET-' + Math.floor(1000 + Math.random() * 9000),
      reason: 'Customer requested exchange for French Vanilla'
    };

    const { renderTemplate } = require('../services/emailService');
    let subject = renderTemplate(tpl.subject, sampleVars);
    let html = renderTemplate(tpl.html, sampleVars);

    if (req.body.note && req.body.note.trim()) {
      const noteHtml = `
        <div style="margin-top:20px;padding:14px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;font-family:sans-serif;">
          <strong style="color:#92400e;display:block;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Custom Admin Test Note:</strong>
          <span style="color:#78350f;font-size:14px;">${req.body.note.trim()}</span>
        </div>
      `;
      html += noteHtml;
    }

    const result = await sendEmail(testTo, templateKey, sampleVars, {
      subject,
      html,
      force: true
    });

    logAdminAction(req.user, 'EMAIL_TEST_SENT', 'EMAIL', `Dispatched test email to ${testTo} using template ${templateKey}`, { to: testTo, templateKey, simulated: result.simulated });

    res.json({
      success: result.success,
      simulated: Boolean(result.simulated),
      message: result.message || (result.success ? 'Test email dispatched successfully!' : 'Delivery error'),
      logEntry: result.logEntry
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error sending test email: ' + err.message });
  }
});

// ── GET /api/email/notifications ───────────────────────────────
router.get('/notifications', protect, admin, (req, res) => {
  res.json({ success: true, notifications: getEmailNotifications() });
});

// ── PUT /api/email/notifications ───────────────────────────────
router.put('/notifications', protect, admin, (req, res) => {
  const notifications = getEmailNotifications();
  const allowed = ['order_placed', 'order_shipped', 'order_delivered', 'order_cancelled', 'welcome', 'lowStock', 'returnApproved', 'returnRejected'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) notifications[key] = Boolean(req.body[key]);
  }
  logAdminAction(req.user, 'EMAIL_NOTIFICATIONS_UPDATED', 'EMAIL', 'Updated email notification toggles', req.body);
  res.json({ success: true, message: 'Notification settings saved.', notifications });
});

// ── GET /api/email/templates ────────────────────────────────────
router.get('/templates', protect, admin, (req, res) => {
  res.json({ success: true, templates: getEmailTemplates() });
});

// ── PUT /api/email/templates/:name ─────────────────────────────
router.put('/templates/:name', protect, admin, (req, res) => {
  const templates = getEmailTemplates();
  const { name } = req.params;
  if (!templates[name]) return res.status(404).json({ success: false, message: 'Template not found.' });
  if (req.body.subject !== undefined) templates[name].subject = req.body.subject;
  if (req.body.html !== undefined) templates[name].html = req.body.html;
  logAdminAction(req.user, 'EMAIL_TEMPLATE_UPDATED', 'EMAIL', `Updated template: ${name}`, { name });
  res.json({ success: true, message: 'Template saved.', template: templates[name] });
});

// ── POST /api/email/templates/:name/preview ─────────────────────
router.post('/templates/:name/preview', protect, admin, (req, res) => {
  const templates = getEmailTemplates();
  const { name } = req.params;
  if (!templates[name]) return res.status(404).json({ success: false, message: 'Template not found.' });
  const { renderTemplate } = require('../services/emailService');
  const sampleVars = {
    customerName: 'John Doe', orderNumber: 'PX000123', amount: '2,999',
    processingDays: '1', deliveryDate: 'Sep 10, 2026', courier: 'Blue Dart',
    trackingId: 'BD123456789IN', productName: 'Gold Standard Whey', currentStock: '5', threshold: '10',
    returnId: 'RET001', reason: 'Outside return window', ...req.body
  };
  const html = renderTemplate(templates[name].html, sampleVars);
  const subject = renderTemplate(templates[name].subject, sampleVars);
  res.json({ success: true, subject, html });
});

// ── GET /api/email/logs ─────────────────────────────────────────
router.get('/logs', protect, admin, (req, res) => {
  if (!mockDb.emailLogs) mockDb.emailLogs = [];
  const { status, page = 1, limit = 50 } = req.query;
  let logs = mockDb.emailLogs;
  if (status && status !== 'all') logs = logs.filter(l => l.status === status);
  const total = logs.length;
  const start = (Number(page) - 1) * Number(limit);
  const paged = logs.slice(start, start + Number(limit));
  res.json({ success: true, total, logs: paged });
});

// ── POST /api/email/logs/:id/retry ─────────────────────────────
router.post('/logs/:id/retry', protect, admin, async (req, res) => {
  const result = await retryEmail(req.params.id);
  if (result.success) {
    logAdminAction(req.user, 'EMAIL_RETRIED', 'EMAIL', `Retried email log ${req.params.id}`, {});
  }
  res.json(result);
});

module.exports = router;
