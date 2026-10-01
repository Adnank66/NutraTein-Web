const express = require('express');
const router = express.Router();
const mockDb = require('../utils/mockDb');
const { sendEmail, getTransporter } = require('../services/emailService');
const { logAdminAction } = require('../utils/adminLogger');

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    if (message.length < 10) {
      return res.status(400).json({ success: false, message: 'Message must be at least 10 characters.' });
    }

    const topic = subject || 'General Inquiry';
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? phone.trim() : '';
    const cleanMessage = message.trim();

    // 1. Persist to mockDb and MongoDB
    const inquiryRecord = {
      _id: 'inq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      subject: topic,
      message: cleanMessage,
      status: 'NEW',
      createdAt: new Date()
    };

    if (!mockDb.contactInquiries) mockDb.contactInquiries = [];
    mockDb.contactInquiries.unshift(inquiryRecord);

    if (global.USE_MONGODB) {
      try {
        const ContactMessage = require('../models/ContactMessage');
        await ContactMessage.create(inquiryRecord);
      } catch (dbErr) {
        console.warn('MongoDB ContactMessage save error:', dbErr.message);
      }
    }

    // Log admin activity
    logAdminAction(null, 'CONTACT_INQUIRY_RECEIVED', 'CONTACT', `Inquiry received from ${cleanName} (${cleanEmail}): ${topic}`, inquiryRecord);

    // 2. Check SMTP Transporter
    const transporter = getTransporter();
    const adminRecipient = 'kaziadnan275@gmail.com';

    if (!transporter) {
      // Honest response: inquiry saved, SMTP not configured
      return res.json({
        success: true,
        saved: true,
        emailSent: false,
        message: `Thank you, ${cleanName}! Your inquiry regarding "${topic}" has been recorded. (Live email delivery is currently pending SMTP configuration; our team will follow up at ${cleanEmail}, or reach us directly at ${adminRecipient}).`
      });
    }

    // 3. If SMTP configured, dispatch live emails
    const customerHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
        <h2 style="color:#D9651E;margin-top:0;">Message Received! 📨</h2>
        <p>Hi <strong>${cleanName}</strong>,</p>
        <p>Thank you for reaching out to NUTRATEIN. We have received your inquiry regarding <strong>${topic}</strong>.</p>
        <div style="background:#f8fafc;padding:16px;border-radius:8px;border-left:4px solid #D9651E;margin:18px 0;">
          <strong style="font-size:12px;color:#64748b;text-transform:uppercase;">Your Message:</strong>
          <p style="margin:6px 0 0;font-size:14px;color:#1e293b;line-height:1.5;">${cleanMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
        <p>Our certified sports nutrition support team is looking into this and will get back to you at <strong>${cleanEmail}</strong>${cleanPhone ? ' or ' + cleanPhone : ''} within 24 hours.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p style="color:#64748b;font-size:12px;margin:0;">NUTRATEIN Sports Nutrition Ltd. | Email: ${adminRecipient} | WhatsApp/Helpline: +91 93215 98094</p>
      </div>
    `;

    const adminHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
        <h3 style="color:#0F172A;margin-top:0;">📩 New Contact Inquiry Received</h3>
        <p><strong>From:</strong> ${cleanName} (&lt;${cleanEmail}&gt;)</p>
        <p><strong>Phone:</strong> ${cleanPhone || 'Not provided'}</p>
        <p><strong>Topic:</strong> ${topic}</p>
        <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:16px 0;">
          <strong>Message Body:</strong>
          <p style="margin:8px 0 0;line-height:1.5;">${cleanMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
        <p style="font-size:12px;color:#64748b;">Timestamp: ${new Date().toLocaleString('en-IN')}</p>
      </div>
    `;

    await sendEmail(cleanEmail, 'contact_confirmation', { customerName: cleanName, subject: topic, message: cleanMessage }, {
      subject: `We Received Your Message, ${cleanName}! | NUTRATEIN Support`,
      html: customerHtml,
      force: true
    });

    await sendEmail(adminRecipient, 'admin_contact_alert', { name: cleanName, email: cleanEmail, phone: cleanPhone, subject: topic, message: cleanMessage }, {
      subject: `[Contact Inquiry] ${topic} — from ${cleanName}`,
      html: adminHtml,
      force: true
    });

    res.json({
      success: true,
      saved: true,
      emailSent: true,
      message: 'Thank you! Your message has been sent successfully. A confirmation email has been dispatched to your inbox.'
    });
  } catch (error) {
    console.error('Error in /api/contact:', error);
    res.status(500).json({ success: false, message: 'Failed to process inquiry: ' + error.message });
  }
});

// GET /api/contact - Admin: view all inquiries
router.get('/', async (req, res) => {
  try {
    if (global.USE_MONGODB) {
      const ContactMessage = require('../models/ContactMessage');
      const messages = await ContactMessage.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: messages.length, inquiries: messages });
    }
    const list = mockDb.contactInquiries || [];
    res.json({ success: true, count: list.length, inquiries: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;