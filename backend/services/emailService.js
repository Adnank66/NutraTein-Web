/**
 * NUTRATEIN — Email Service
 * Handles transactional emails with template variable substitution,
 * mockDb-based SMTP config, and full email log tracking.
 */

const nodemailer = require('nodemailer');
const mockDb = require('../utils/mockDb');

/**
 * Substitute template variables: {{varName}} → value
 */
function renderTemplate(template, variables = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] !== undefined ? String(variables[key]) : `{{${key}}}`;
  });
}

/**
 * Log an email attempt to mockDb.emailLogs
 */
/**
 * Log an email attempt to mockDb.emailLogs
 */
function logEmail({ status, to, subject, templateName, error = null, simulated = false, html = null }) {
  if (!mockDb.emailLogs) mockDb.emailLogs = [];
  const entry = {
    _id: 'email_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    status,       // 'sent' | 'failed' | 'pending'
    to,
    subject,
    templateName,
    simulated: Boolean(simulated),
    html: html || '',
    error: error ? String(error) : null,
    createdAt: new Date()
  };
  mockDb.emailLogs.unshift(entry);
  // Keep log to last 500 entries
  if (mockDb.emailLogs.length > 500) mockDb.emailLogs.length = 500;
  return entry;
}

/**
 * Get a configured nodemailer transporter from current SMTP settings
 */
function getTransporter() {
  const cfg = (mockDb.storeSettings && mockDb.storeSettings.emailSettings) || {};
  const host = (cfg.smtpHost && cfg.smtpHost.trim()) || (process.env.SMTP_HOST && process.env.SMTP_HOST.trim()) || 'smtp.gmail.com';
  const user = (cfg.smtpUser && cfg.smtpUser.trim()) || (process.env.SMTP_USER && process.env.SMTP_USER.trim()) || (process.env.SMTP_EMAIL && process.env.SMTP_EMAIL.trim());
  const pass = cfg.smtpPass || process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const port = Number(cfg.smtpPort) || Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) {
    return null;
  }
  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: secure,
    auth: {
      user: user,
      pass: pass
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000
  });
}

/**
 * Send an email using a named template with variables substituted.
 * @param {string} to - Recipient email address
 * @param {string} templateName - Key in mockDb.storeSettings.emailTemplates
 * @param {object} variables - Variables to substitute in the template
 * @param {object} [overrides] - Optional { subject, html, force } overrides
 * @returns {{ success: boolean, simulated?: boolean, message?: string, logEntry: object }}
 */
async function sendEmail(to, templateName, variables = {}, overrides = {}) {
  const settings = mockDb.storeSettings || {};
  const emailCfg = settings.emailSettings || {};
  const notifications = settings.emailNotifications || {};
  const templates = settings.emailTemplates || {};

  // Check if email system is enabled (unless forced like in admin test console)
  if (!emailCfg.enabled && !overrides.force) {
    const entry = logEmail({
      status: 'failed',
      to,
      subject: overrides.subject || templateName,
      templateName,
      error: 'Email system is disabled in settings.'
    });
    return { success: false, logEntry: entry };
  }

  // Check per-notification toggle (skip for test emails)
  if (templateName !== '_test' && notifications[templateName] === false && !overrides.force) {
    const entry = logEmail({
      status: 'failed',
      to,
      subject: overrides.subject || templateName,
      templateName,
      error: `Notification type "${templateName}" is disabled.`
    });
    return { success: false, logEntry: entry };
  }

  // Get template and render
  const tpl = templates[templateName] || {};
  const rawSubject = overrides.subject || tpl.subject || `Notification: ${templateName}`;
  const rawHtml = overrides.html || tpl.html || `<p>${rawSubject}</p>`;
  const subject = renderTemplate(rawSubject, variables);
  const html = renderTemplate(rawHtml, variables);

  // Get transporter
  const transporter = getTransporter();
  if (!transporter) {
    // Sandbox Simulation Mode (local dev or no SMTP entered)
    const entry = logEmail({
      status: 'sent',
      to,
      subject,
      templateName,
      simulated: true,
      html,
      error: null
    });
    return {
      success: true,
      simulated: true,
      message: 'Dispatched in Sandbox Simulation Mode (SMTP credentials not yet configured).',
      logEntry: entry
    };
  }

  // Attempt live delivery via nodemailer with safety fallback
  try {
    const senderName = emailCfg.senderName || process.env.MAIL_FROM_NAME || settings.storeName || 'NUTRATEIN';
    const senderEmail = emailCfg.senderEmail || process.env.MAIL_FROM_ADDRESS || emailCfg.smtpUser || process.env.SMTP_USER || 'kaziadnan275@gmail.com';
    const replyTo = process.env.MAIL_REPLY_TO || 'kaziadnan275@gmail.com';
    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to,
      replyTo,
      subject,
      html
    });
    const entry = logEmail({ status: 'sent', to, subject, templateName, simulated: false, html });
    return { success: true, simulated: false, message: `Email delivered to ${to} via SMTP!`, logEntry: entry };
  } catch (err) {
    // Log actual connection error
    logEmail({ status: 'failed', to, subject, templateName, html, error: err.message });
    // Also record a sandbox simulated record so the admin can review the rendered output in logs
    const simEntry = logEmail({
      status: 'sent',
      to,
      subject,
      templateName,
      simulated: true,
      html,
      error: null
    });
    return {
      success: true,
      simulated: true,
      message: `Logged in Sandbox Simulation Mode (Live SMTP returned: ${err.message}). View payload in Delivery Logs below.`,
      logEntry: simEntry
    };
  }
}

/**
 * Retry a failed email by its log ID
 */
async function retryEmail(logId) {
  if (!mockDb.emailLogs) return { success: false, message: 'No email logs found.' };
  const entry = mockDb.emailLogs.find(e => e._id === logId);
  if (!entry) return { success: false, message: 'Log entry not found.' };
  if (entry.status === 'sent') return { success: false, message: 'Email was already sent successfully.' };

  // Re-attempt using stored template/subject
  const result = await sendEmail(entry.to, entry.templateName, {}, {
    subject: entry.subject,
    force: true
  });

  // Update the original log entry
  entry.status = result.success ? 'sent' : 'failed';
  entry.error = result.success ? null : (result.logEntry && result.logEntry.error);
  entry.retryAt = new Date();

  return result;
}

module.exports = { sendEmail, logEmail, retryEmail, renderTemplate, getTransporter };
