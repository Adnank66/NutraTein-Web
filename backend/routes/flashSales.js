const express = require("express");
const router = express.Router();
const mockDb = require("../utils/mockDb");
const { protect } = require("../middleware/auth");
const admin = require("../middleware/admin");
const { logAdminAction } = require("../utils/adminLogger");

function isSaleActive(sale) {
  if (!sale.isActive) return false;
  const now = new Date();
  return new Date(sale.startAt) <= now && new Date(sale.endAt) >= now;
}

// GET /api/flash-sales/active - public
router.get("/active", async (req, res) => {
  try {
    const now = new Date();
    const active = mockDb.flashSales.filter(s => isSaleActive(s));
    const enriched = active.map(sale => {
      const saleProducts = (sale.products || []).map(pid => {
        const p = mockDb.products.find(pr => pr._id === pid);
        if (!p) return null;
        const salePrice = sale.discountType === "PERCENT"
          ? Math.round(p.basePrice * (1 - sale.discountValue / 100))
          : Math.max(0, p.basePrice - sale.discountValue);
        return { _id: p._id, name: p.name, slug: p.slug, image: p.images && p.images[0] ? p.images[0].url : null, basePrice: p.basePrice, salePrice, discountValue: sale.discountValue, discountType: sale.discountType, rating: p.rating, stock: p.stock };
      }).filter(Boolean);
      return { ...sale, saleProducts, serverTime: now.toISOString() };
    });
    res.json({ success: true, sales: enriched, serverTime: now.toISOString() });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/flash-sales/:productId/price - validate sale price for product
router.get("/:productId/price", async (req, res) => {
  try {
    const product = mockDb.products.find(p => p._id === req.params.productId || p.slug === req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const activeSale = mockDb.flashSales.find(s => isSaleActive(s) && (s.products || []).includes(product._id));
    if (!activeSale) return res.json({ success: true, onSale: false, basePrice: product.basePrice, salePrice: product.basePrice });
    const salePrice = activeSale.discountType === "PERCENT"
      ? Math.round(product.basePrice * (1 - activeSale.discountValue / 100))
      : Math.max(0, product.basePrice - activeSale.discountValue);
    res.json({ success: true, onSale: true, basePrice: product.basePrice, salePrice, discountType: activeSale.discountType, discountValue: activeSale.discountValue, saleId: activeSale._id, saleName: activeSale.name, endAt: activeSale.endAt, serverTime: new Date().toISOString() });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/flash-sales - admin all
router.get("/", protect, admin, async (req, res) => {
  try {
    const enriched = mockDb.flashSales.map(s => ({ ...s, isCurrentlyActive: isSaleActive(s), serverTime: new Date().toISOString() }));
    res.json({ success: true, sales: enriched });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/flash-sales - admin create
router.post("/", protect, admin, async (req, res) => {
  try {
    const { name, description, discountType, discountValue, products, startAt, endAt, maxQuantityPerUser } = req.body;
    if (!name || !discountType || !discountValue || !startAt || !endAt)
      return res.status(400).json({ success: false, message: "Missing required fields" });
    const sale = { _id: "fs_" + Date.now(), name, description: description || "", discountType, discountValue: Number(discountValue), products: products || [], startAt: new Date(startAt), endAt: new Date(endAt), isActive: false, maxQuantityPerUser: maxQuantityPerUser || 0, createdAt: new Date() };
    mockDb.flashSales.push(sale);
    logAdminAction(req.user, "FLASH_SALE_CREATED", "FLASH_SALES", "Created flash sale: " + name, { saleId: sale._id });
    res.status(201).json({ success: true, sale });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/flash-sales/:id - admin update
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const sale = mockDb.flashSales.find(s => s._id === req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: "Flash sale not found" });
    const { name, description, discountType, discountValue, products, startAt, endAt, maxQuantityPerUser } = req.body;
    if (name !== undefined) sale.name = name;
    if (description !== undefined) sale.description = description;
    if (discountType !== undefined) sale.discountType = discountType;
    if (discountValue !== undefined) sale.discountValue = Number(discountValue);
    if (products !== undefined) sale.products = products;
    if (startAt !== undefined) sale.startAt = new Date(startAt);
    if (endAt !== undefined) sale.endAt = new Date(endAt);
    if (maxQuantityPerUser !== undefined) sale.maxQuantityPerUser = Number(maxQuantityPerUser);
    logAdminAction(req.user, "FLASH_SALE_UPDATED", "FLASH_SALES", "Updated flash sale: " + sale.name, { saleId: sale._id });
    res.json({ success: true, sale });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/flash-sales/:id/toggle - admin activate/deactivate
router.post("/:id/toggle", protect, admin, async (req, res) => {
  try {
    const sale = mockDb.flashSales.find(s => s._id === req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: "Flash sale not found" });
    sale.isActive = !sale.isActive;
    logAdminAction(req.user, sale.isActive ? "FLASH_SALE_ACTIVATED" : "FLASH_SALE_DEACTIVATED", "FLASH_SALES", (sale.isActive ? "Activated" : "Deactivated") + " flash sale: " + sale.name, { saleId: sale._id });
    res.json({ success: true, isActive: sale.isActive, sale });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/flash-sales/:id - admin delete
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const idx = mockDb.flashSales.findIndex(s => s._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: "Flash sale not found" });
    const [removed] = mockDb.flashSales.splice(idx, 1);
    logAdminAction(req.user, "FLASH_SALE_DELETED", "FLASH_SALES", "Deleted flash sale: " + removed.name, { saleId: removed._id });
    res.json({ success: true, message: "Flash sale deleted." });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
