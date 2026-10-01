const express = require('express');
const router = express.Router();

// Supported pincodes configuration
// In production, this would come from a database or third-party API
const PINCODE_CONFIG = {
  metros: {
    pincodes: ['110001','110002','110011','400001','400002','400011','560001','560002','500001','600001','700001'],
    deliveryDays: 2,
    cod: true,
    charge: 0
  },
  tier2: {
    pincodes: ['302001','302002','226001','226002','380001','380002','411001','411002','530001','440001'],
    deliveryDays: 3,
    cod: true,
    charge: 49
  },
  remote: {
    pincodes: ['737101','737102','795001','793001','791001'],
    deliveryDays: 7,
    cod: false,
    charge: 99
  }
};

// GET /api/pincode/check?pincode=110001
router.get('/check', async (req, res) => {
  try {
    const { pincode } = req.query;
    if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ success: false, message: 'Enter a valid 6-digit pincode.' });
    }

    let result = null;
    for (const [zone, config] of Object.entries(PINCODE_CONFIG)) {
      if (config.pincodes.includes(pincode)) {
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + config.deliveryDays);
        result = {
          available: true,
          pincode,
          deliveryDays: config.deliveryDays,
          estimatedDelivery: deliveryDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
          cod: config.cod,
          shippingCharge: config.charge,
          zone
        };
        break;
      }
    }

    if (!result) {
      // For demo - show delivery for any 6-digit pincode
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 5);
      result = {
        available: true,
        pincode,
        deliveryDays: 5,
        estimatedDelivery: deliveryDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
        cod: true,
        shippingCharge: 79,
        zone: 'standard'
      };
    }

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;