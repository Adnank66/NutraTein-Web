/**
 * NUTRATEIN — Centralized Store Content & Text Configuration
 * Edit store text, hero headers, buttons, contact information, FAQs,
 * and footer content directly from VS Code right here!
 *
 * Changes made in this file automatically propagate across the website.
 */

window.SITE_CONTENT = {
  // Store Identity
  site: {
    name: 'NUTRATEIN',
    tagline: 'Elite Sports Nutrition & Pure Performance Supplements',
    logoText: 'NUTRA',
    logoAccent: 'TEIN',
    currencySymbol: '₹',
    supportPhone: '+91 98765 43210',
    supportEmail: 'kaziadnan275@gmail.com',
    adminEmail: 'kaziadnan275@gmail.com',
    address: 'Plot 42, Bandra Kurla Complex, Mumbai, Maharashtra 400051',
    workingHours: 'Mon - Sat: 9:00 AM - 8:00 PM IST',
    copyright: '© 2026 NUTRATEIN India. All rights reserved. 100% Authentic Supplements.'
  },

  // Hero Section Defaults (Fallback if dynamic database banners are loading)
  hero: {
    badge: '⚡ PREMIUM PERFORMANCE FUEL',
    title: 'FUEL YOUR OBSESSION WITH PURE POWER',
    subtitle: 'Ultra-pure whey isolates, micronized creatine monohydrate, and clinical performance formulas engineered for unmatched athletic gains.',
    primaryBtn: {
      text: 'Shop Best Sellers',
      link: 'shop.html'
    },
    secondaryBtn: {
      text: 'Build Custom Stack',
      link: 'build-stack.html'
    }
  },

  // Top Announcement / Notification Bar
  promotional: {
    topBarAnnouncement: '🔥 FREE EXPRESS SHIPPING ON ALL ORDERS OVER ₹999 | USE CODE  FIRST10 FOR 10% OFF',
    flashSaleTitle: 'LIGHTNING SALE — UP TO 40% OFF',
    flashSaleSubtitle: 'Strictly limited quantities. Grab your workout stacks before stocks run dry!'
  },

  // Trust Badges & Core Features
  features: [
    {
      icon: '🛡️',
      title: '100% Authentic Products',
      description: 'Sourced directly from verified manufacturers with anti-counterfeit scratch codes.'
    },
    {
      icon: '🔬',
      title: 'Third-Party Lab Tested',
      description: 'Zero amino spiking, zero heavy metals. Every batch verified by ISO accredited labs.'
    },
    {
      icon: '⚡',
      title: 'Fast & Secure Delivery',
      description: 'Dispatched within 24 hours. Real-time courier tracking right to your doorstep.'
    },
    {
      icon: '🔄',
      title: 'Easy 30-Day Returns',
      description: 'Hassle-free return and replacement policy for damaged or sealed authentic items.'
    }
  ],

  // Frequently Asked Questions
  faq: [
    {
      q: 'How do I verify the authenticity of my protein tub?',
      a: 'Every NUTRATEIN tub comes with an anti-counterfeit scratch code sticker on the seal. Visit our Verify page, enter your 12-digit code, and instantly authenticate your batch.'
    },
    {
      q: 'What is the recommended dosage for Micronized Creatine Monohydrate?',
      a: 'Take 3g to 5g daily mixed with water or fruit juice. Consistency is key—take it at the same time every day, either pre-workout or post-workout.'
    },
    {
      q: 'When will my order be dispatched?',
      a: 'Orders placed before 2:00 PM are dispatched on the same business day. Delivery takes 2-4 business days for metropolitan cities.'
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Cash on Delivery (COD).'
    }
  ],

  // Contact Information
  contact: {
    heading: 'Get In Touch',
    subheading: 'Have a question about your order, stack advice, or bulk wholesale enquiries? We are here to help.',
    phone: '+91 98765 43210',
    email: 'kaziadnan275@gmail.com',
    whatsapp: '+91 98765 43210',
    businessHours: 'Monday – Saturday: 9:00 AM – 8:00 PM IST',
    addressLine1: 'NUTRATEIN Nutrition Pvt Ltd',
    addressLine2: 'Level 5, Corporate Park, BKC, Mumbai 400051'
  },

  // Footer Links & Text
  footer: {
    aboutText: 'NUTRATEIN is India\'s trusted performance nutrition platform. We provide certified authentic whey proteins, gainers, pre-workouts, and amino acids directly to fitness enthusiasts and athletes nationwide.',
    newsletterHeading: 'STAY AHEAD OF THE GAME',
    newsletterSubtext: 'Subscribe for exclusive drop alerts, training stack blueprints, and member discounts.',
    social: {
      instagram: 'https://instagram.com/nutratein',
      facebook: 'https://facebook.com/nutratein',
      youtube: 'https://youtube.com/nutratein',
      twitter: 'https://twitter.com/nutratein'
    }
  }
};

/**
 * Automatically applies site content to elements marked with data-content=key.path
 */
function applySiteContent() {
  if (typeof document === 'undefined' || !window.SITE_CONTENT) return;

  function getNestedValue(obj, path) {
    return path.split('.').reduce((prev, curr) => (prev && prev[curr] !== undefined ? prev[curr] : null), obj);
  }

  const elements = document.querySelectorAll('[data-content]');
  elements.forEach(el => {
    const key = el.getAttribute('data-content');
    const val = getNestedValue(window.SITE_CONTENT, key);
    if (val !== null && val !== undefined) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = val;
      } else {
        el.textContent = val;
      }
    }
  });
}

// Auto-run when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySiteContent);
  } else {
    applySiteContent();
  }
}
