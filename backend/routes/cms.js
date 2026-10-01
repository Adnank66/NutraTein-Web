const express = require('express');
const router = express.Router();
const mockDb = require('../utils/mockDb');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');
const { logAdminAction } = require('../utils/adminLogger');

// Default CMS content
function getCmsPages() {
  if (!mockDb.storeSettings.cmsPages) {
    mockDb.storeSettings.cmsPages = {
      about: {
        title: 'About PROTEINX',
        subtitle: 'India\'s Premium Fitness Supplement Brand',
        mission: 'We believe that every athlete, from beginners to professionals, deserves access to pure, science-backed supplementation. PROTEINX was founded in 2019 with one simple mission: deliver the cleanest, most effective sports nutrition products made from the finest ingredients.',
        vision: 'To become India\'s most trusted sports nutrition brand by maintaining transparency, quality, and integrity in everything we do.',
        values: [
          { icon: '🔬', title: 'Science-Backed', desc: 'Every formula is developed with nutritional scientists and tested for efficacy.' },
          { icon: '🌿', title: 'Clean Ingredients', desc: 'No fillers, no proprietary blends. You know exactly what you are getting.' },
          { icon: '💪', title: 'Athlete-First', desc: 'Designed by athletes, for athletes at every level of their fitness journey.' },
          { icon: '🛡️', title: 'Quality Assured', desc: 'Third-party tested for purity, potency, and label accuracy.' }
        ],
        teamHeading: 'Built by a Team That Trains',
        teamDesc: 'PROTEINX was started by competitive athletes who were tired of compromised products. We\'re fueled by the same passion as our customers.'
      },
      faq: {
        title: 'Frequently Asked Questions',
        items: [
          { q: 'How do I choose the right protein for my goal?', a: 'For muscle gain and recovery, whey isolate or concentrate works best. For plant-based diets, our pea + rice blend is ideal. Use the Protein Calculator on our site for personalized recommendations.' },
          { q: 'When is the best time to take protein?', a: 'Within 30–60 minutes post-workout is ideal for muscle recovery. You can also have it first thing in the morning or as a meal replacement snack.' },
          { q: 'Are your products third-party tested?', a: 'Yes. All PROTEINX products are batch-tested by accredited third-party labs for banned substances, heavy metals, and label accuracy.' },
          { q: 'Do you offer free shipping?', a: 'Yes! Free shipping on all orders above ₹999. Standard delivery takes 3–7 business days.' },
          { q: 'What is your return policy?', a: 'We accept returns within 7 days of delivery for unopened, undamaged products. Contact our support team with your order number to initiate a return.' },
          { q: 'Can I use multiple supplements together?', a: 'Yes. Our Build Your Stack feature helps you create safe, effective supplement combinations. However, always consult a healthcare professional if you have any medical conditions.' }
        ]
      },
      contact: {
        email: 'support@proteinx.in',
        phone: '+91 93215 98094',
        hours: 'Monday – Saturday, 9 AM – 6 PM IST',
        address: 'PROTEINX Sports Nutrition Ltd.\nMG Road, Andheri East\nMumbai, Maharashtra – 400069',
        mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3769.9!2d72.8!3d19.1!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0!2zMTnCsDA2JzAwLjAiTiA3MsKwNDgnMDAuMCJF!5e0!3m2!1sen!2sin!4v1000000000000'
      },
      privacyPolicy: {
        title: 'Privacy Policy',
        lastUpdated: '2026-01-01',
        content: 'PROTEINX collects personal information including name, email, phone, and address to process orders and provide customer service. We do not sell or share your personal data with third parties except as required to fulfill orders (shipping partners, payment processors). You may request deletion of your account data at any time by contacting support@proteinx.in.'
      },
      termsOfService: {
        title: 'Terms of Service',
        lastUpdated: '2026-01-01',
        content: 'By using the PROTEINX website and purchasing our products, you agree to these terms. Products are sold for personal use only. PROTEINX reserves the right to cancel orders and refuse service. All prices are in Indian Rupees (INR) inclusive of applicable taxes.'
      },
      refundPolicy: {
        title: 'Refund & Return Policy',
        lastUpdated: '2026-01-01',
        content: 'Returns are accepted within 7 days of delivery for unopened, undamaged products. To initiate a return, contact support@proteinx.in with your order number and reason. Refunds are processed within 5–7 business days to the original payment method. Opened products are non-refundable unless there is a manufacturing defect.'
      }
    };
  }
  return mockDb.storeSettings.cmsPages;
}

// ── GET /api/cms/:page ──────────────────────────────────────────
// Public: get page content
router.get('/:page', (req, res) => {
  const pages = getCmsPages();
  const page = pages[req.params.page];
  if (!page) return res.status(404).json({ success: false, message: 'Page not found.' });
  res.json({ success: true, page });
});

// ── PUT /api/cms/:page ──────────────────────────────────────────
// Admin: update page content
router.put('/:page', protect, admin, (req, res) => {
  const pages = getCmsPages();
  const pageName = req.params.page;
  if (!pages[pageName]) return res.status(404).json({ success: false, message: 'Page not found.' });

  // Deep merge update
  pages[pageName] = Object.assign({}, pages[pageName], req.body);
  logAdminAction(req.user, 'CMS_PAGE_UPDATED', 'CMS', `Updated CMS page: ${pageName}`, { page: pageName });
  res.json({ success: true, message: `"${pageName}" page updated successfully.`, page: pages[pageName] });
});

module.exports = router;
