const express = require("express");
const router = express.Router();
const mockDb = require("../utils/mockDb");
const { protect } = require("../middleware/auth");
const admin = require("../middleware/admin");
const { logAdminAction } = require("../utils/adminLogger");

// GET /api/settings - public (non-sensitive info)
router.get("/", async (req, res) => {
  try {
    const s = mockDb.storeSettings;
    // Return public-safe settings only
    res.json({
      success: true,
      settings: {
        whatsappNumber: s.whatsappNumber,
        whatsappPreMessage: s.whatsappPreMessage,
        whatsappEnabled: s.whatsappEnabled !== false, // default true
        processingDays: s.processingDays,
        minDeliveryDays: s.minDeliveryDays,
        maxDeliveryDays: s.maxDeliveryDays,
        returnWindowDays: s.returnWindowDays,
        returnPolicy: s.returnPolicy,
        cancellationPolicy: s.cancellationPolicy,
        storeName: s.storeName,
        storePhone: s.storePhone,
        storeEmail: s.storeEmail,
        storeAddress: s.storeAddress,
        storeGSTIN: s.storeGSTIN,
        barcodeEnabled: s.barcodeEnabled,
        flashSaleEnabled: s.flashSaleEnabled,
        pwaEnabled: s.pwaEnabled,
        themeSettings: s.themeSettings || {
          primaryColor: '#006948',
          secondaryColor: '#006a61',
          accentColor: '#0d9488',
          headerColor: '#FFFFFF',
          footerColor: '#141b2b',
          defaultTheme: 'system',
          borderRadius: '8px',
          cardStyle: 'elevated',
          buttonStyle: 'rounded'
        }
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/settings - admin: update settings
router.put("/", protect, admin, async (req, res) => {
  try {
    const allowed = ["whatsappNumber","whatsappPreMessage","whatsappEnabled","processingDays","minDeliveryDays","maxDeliveryDays","returnWindowDays","returnPolicy","cancellationPolicy","storeName","storePhone","storeEmail","storeAddress","storeGSTIN","lowStockGlobalThreshold","barcodeEnabled","flashSaleEnabled","pwaEnabled","themeSettings"];
    const updates = [];

    // Check reset theme request
    if (req.body.resetTheme) {
      mockDb.storeSettings.themeSettings = {
        primaryColor: '#006948',
        secondaryColor: '#006a61',
        accentColor: '#0d9488',
        headerColor: '#FFFFFF',
        footerColor: '#141b2b',
        defaultTheme: 'system',
        borderRadius: '8px',
        cardStyle: 'elevated',
        buttonStyle: 'rounded'
      };
      updates.push("themeSettings(reset)");
    }

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'themeSettings' && typeof req.body[key] === 'object') {
          mockDb.storeSettings.themeSettings = Object.assign({}, mockDb.storeSettings.themeSettings || {}, req.body.themeSettings);
        } else {
          mockDb.storeSettings[key] = req.body[key];
        }
        updates.push(key);
      }
    }
    if (updates.length === 0)
      return res.status(400).json({ success: false, message: "No valid fields provided." });
    logAdminAction(req.user, "SETTINGS_UPDATED", "SETTINGS", "Updated store settings: " + updates.join(", "), { fields: updates });
    res.json({ success: true, message: "Settings updated successfully.", settings: mockDb.storeSettings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
