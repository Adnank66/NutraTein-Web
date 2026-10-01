const express = require("express");
const router = express.Router();
const mockDb = require("../utils/mockDb");
const { protect } = require("../middleware/auth");
const admin = require("../middleware/admin");
const { logAdminAction } = require("../utils/adminLogger");

const VALID_STATUSES = ["REQUESTED","UNDER_REVIEW","APPROVED","REJECTED","PICKUP_PENDING","RECEIVED","REFUND_PROCESSING","REFUNDED","COMPLETED"];

// POST /api/returns - customer submits return/cancel request
router.post("/", protect, async (req, res) => {
  try {
    const { orderId, type, reason, description } = req.body;
    if (!orderId || !type || !reason)
      return res.status(400).json({ success: false, message: "orderId, type, and reason are required." });
    if (!["RETURN", "CANCELLATION"].includes(type))
      return res.status(400).json({ success: false, message: "type must be RETURN or CANCELLATION." });

    const order = mockDb.orders.find(o => o._id === orderId || o.orderNumber === orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    const userId = String(req.user._id || req.user.id);
    const orderUserId = order.user && (order.user._id || order.user.id) ? String(order.user._id || order.user.id) : order.userId;
    if (orderUserId && String(orderUserId) !== userId && req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Not authorized." });

    if (type === "CANCELLATION") {
      const cancellableStatuses = ["PENDING", "CONFIRMED", "PROCESSING"];
      if (!cancellableStatuses.includes(order.status))
        return res.status(400).json({ success: false, message: "Order cannot be cancelled at status: " + order.status });
    }
    if (type === "RETURN" && order.status !== "DELIVERED")
      return res.status(400).json({ success: false, message: "Returns can only be requested for DELIVERED orders." });

    const existing = mockDb.returns.find(r => r.orderId === order._id && r.status !== "REJECTED" && r.status !== "COMPLETED");
    if (existing)
      return res.status(400).json({ success: false, message: "A request is already pending for this order." });

    const returnRequest = {
      _id: "ret_" + Date.now(),
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId,
      userName: req.user.name || "Customer",
      userEmail: req.user.email || "",
      orderTotal: order.totalAmount,
      type,
      reason,
      description: description || "",
      status: "REQUESTED",
      adminNote: "",
      history: [{ status: "REQUESTED", timestamp: new Date(), by: req.user.name || "Customer" }],
      createdAt: new Date()
    };
    mockDb.returns.push(returnRequest);

    if (type === "CANCELLATION") {
      order.status = "CANCELLED";
      if (!order.history) order.history = [];
      order.history.push({ status: "CANCELLED", timestamp: new Date(), note: "Cancelled by customer: " + reason, updatedBy: req.user.name });
    }

    res.status(201).json({ success: true, message: type === "CANCELLATION" ? "Order cancelled successfully." : "Return request submitted. We will review it within 24 hours.", request: returnRequest });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/returns/my - customer own requests
router.get("/my", protect, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user.id);
    const myReturns = mockDb.returns.filter(r => String(r.userId) === userId);
    res.json({ success: true, returns: myReturns });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/returns - admin all
router.get("/", protect, admin, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    let all = [...mockDb.returns];
    if (status) all = all.filter(r => r.status === status);
    if (type) all = all.filter(r => r.type === type);
    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const skip = (Number(page) - 1) * Number(limit);
    res.json({ success: true, returns: all.slice(skip, skip + Number(limit)), total: all.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/returns/:id - admin update status
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const request = mockDb.returns.find(r => r._id === req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found." });
    const { status, adminNote } = req.body;
    if (status && !VALID_STATUSES.includes(status))
      return res.status(400).json({ success: false, message: "Invalid status." });
    if (status) {
      request.status = status;
      if (!request.history) request.history = [];
      request.history.push({ status, timestamp: new Date(), by: "Admin", note: adminNote || "" });
    }
    if (adminNote !== undefined) request.adminNote = adminNote;
    logAdminAction(req.user, "RETURN_UPDATED", "RETURNS", "Updated return/cancel request " + request._id + " to " + (status || request.status), { requestId: request._id });
    res.json({ success: true, request });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
