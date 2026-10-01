const express = require('express');
const router = express.Router();
const mockDb = require('../utils/mockDb');
const { sendEmail } = require('../services/emailService');

// POST /api/newsletter/subscribe
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!mockDb.newsletterSubscribers) mockDb.newsletterSubscribers = [];

    const existing = mockDb.newsletterSubscribers.find(s => s.email === cleanEmail);
    if (!existing) {
      mockDb.newsletterSubscribers.push({
        email: cleanEmail,
        createdAt: new Date()
      });
    }

    const customerName = cleanEmail.split('@')[0];
    const welcomeHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
        <div style="text-align:center;margin-bottom:20px;">
          <h1 style="color:#111827;margin:0;font-size:24px;letter-spacing:-0.5px;">NUTRA<span style="color:#D9651E;">TEIN</span></h1>
          <p style="color:#64748b;font-size:13px;margin:4px 0 0;">FUEL YOUR STRENGTH. BUILD YOUR FUTURE.</p>
        </div>
        <h2 style="color:#0F172A;font-size:20px;">Welcome to the Team, ${customerName}! 💪</h2>
        <p style="color:#334155;line-height:1.5;">Thank you for subscribing to the NUTRATEIN newsletter. You are now first in line for exclusive release drops, training guides, and members-only flash sales.</p>
        
        <div style="background:linear-gradient(135deg, rgba(217,101,30,0.1), rgba(255,78,0,0.05));border:2px dashed #D9651E;border-radius:10px;padding:20px;text-align:center;margin:24px 0;">
          <span style="font-size:12px;font-weight:700;letter-spacing:0.1em;color:#9A3412;text-transform:uppercase;">Your Welcome Gift</span>
          <div style="font-size:28px;font-weight:900;letter-spacing:2px;color:#D9651E;margin:8px 0;font-family:monospace;">FIRST10</div>
          <p style="margin:0;font-size:13px;color:#475569;">Use this coupon code at checkout for <strong>10% OFF</strong> your first order!</p>
        </div>

        <div style="text-align:center;margin:24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/shop.html" style="background:#D9651E;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">Claim Your Discount & Shop Now</a>
        </div>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p style="color:#64748b;font-size:12px;margin:0;text-align:center;">NUTRATEIN Sports Nutrition Ltd. | Helpline: +91 93215 98094 | kaziadnan275@gmail.com</p>
      </div>
    `;

    const result = await sendEmail(
      cleanEmail,
      'welcome',
      { customerName, promoCode: 'FIRST10' },
      {
        subject: 'Welcome to the NUTRATEIN Family! Here is Your 10% Discount Code 🎁',
        html: welcomeHtml,
        force: true
      }
    );

    res.json({
      success: true,
      message: 'Subscribed! We have sent your 10% welcome coupon to ' + cleanEmail,
      delivery: result.simulated ? 'simulated' : 'live'
    });
  } catch (err) {
    console.error('Error in /api/newsletter/subscribe:', err);
    res.status(500).json({ success: false, message: 'Subscription failed: ' + err.message });
  }
});

module.exports = router;
