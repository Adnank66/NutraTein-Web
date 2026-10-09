import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generateOrderNumber } from "@/lib/utils"
import { calculateDeliveryEstimate } from "@/lib/delivery-estimate"
import { sendMail } from "@/lib/sendEmail"
import { saveBackupOrder } from "@/lib/orders-store"
import { withFastTimeout } from "@/lib/fast-data"
import { sendLowStockAlertEmail } from "@/lib/email-service"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

function getLowStockThreshold(): number {
  try {
    const settingsPath = path.join(process.cwd(), "data", "email-settings.json")
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, "utf-8"))
      if (typeof data.lowStockThreshold === "number") return data.lowStockThreshold
    }
  } catch {}
  return 25 // default low stock threshold
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    const body = await req.json()
    const {
      customer,
      items,
      paymentMethod = "UPI",
      upiTransactionId = null,
      couponCode = null,
    } = body

    // ── 1. Validate Basic Customer & Cart Input ─────────────────────────────
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    const cleanEmail = (customer?.email || "").toLowerCase().trim()
    if (!cleanEmail) {
      return NextResponse.json({ error: "Customer email is required" }, { status: 400 })
    }

    const cleanPhone = (customer?.phone || "").trim()
    const customerName = (customer?.name || "Valued Athlete").trim()
    const validMethod = ["UPI", "COD", "CASH"].includes(paymentMethod) ? paymentMethod : "UPI"

    // ── 2. Server-Side Price & Inventory Verification from MongoDB ──────────
    let verifiedSubtotal = 0
    const verifiedItems: Array<{
      productId: string
      variantId: string | null
      productName: string
      flavor: string | null
      size: string | null
      quantity: number
      price: number
      sku?: string
    }> = []

    for (const cartItem of items) {
      const qty = Math.max(1, parseInt(cartItem.quantity, 10) || 1)
      const productId = cartItem.productId
      const variantId = cartItem.variantId

      // Query real product from MongoDB
      const dbProduct = await prisma.product.findUnique({
        where: { id: productId },
        include: { variants: true },
      })

      if (!dbProduct || !dbProduct.isActive) {
        return NextResponse.json(
          { error: `Product "${cartItem.productName || productId}" is currently unavailable.` },
          { status: 400 }
        )
      }

      let itemPrice = dbProduct.basePrice
      let itemFlavor = cartItem.flavor || null
      let itemSize = cartItem.size || null
      let itemSku = dbProduct.sku || undefined
      let resolvedVariantId: string | null = null

      if (variantId && dbProduct.variants.length > 0) {
        const dbVariant = dbProduct.variants.find((v) => v.id === variantId)
        if (!dbVariant || !dbVariant.isActive) {
          return NextResponse.json(
            { error: `Selected variant for "${dbProduct.name}" is no longer available.` },
            { status: 400 }
          )
        }

        // Validate stock availability
        if (dbVariant.stock < qty) {
          return NextResponse.json(
            {
              error: `Insufficient stock for "${dbProduct.name} (${dbVariant.flavor || dbVariant.size || 'Default'})". Only ${dbVariant.stock} units remaining.`,
            },
            { status: 400 }
          )
        }

        itemPrice = dbVariant.price
        itemFlavor = dbVariant.flavor || itemFlavor
        itemSize = dbVariant.size || itemSize
        itemSku = dbVariant.sku
        resolvedVariantId = dbVariant.id
      } else if (dbProduct.variants.length > 0) {
        // Pick primary variant if none specified
        const firstVariant = dbProduct.variants[0]
        if (firstVariant.stock < qty) {
          return NextResponse.json(
            {
              error: `Insufficient stock for "${dbProduct.name}". Only ${firstVariant.stock} units remaining.`,
            },
            { status: 400 }
          )
        }
        itemPrice = firstVariant.price
        resolvedVariantId = firstVariant.id
        itemSku = firstVariant.sku
      }

      const lineTotal = itemPrice * qty
      verifiedSubtotal += lineTotal

      verifiedItems.push({
        productId: dbProduct.id,
        variantId: resolvedVariantId,
        productName: dbProduct.name,
        flavor: itemFlavor,
        size: itemSize,
        quantity: qty,
        price: itemPrice,
        sku: itemSku,
      })
    }

    // ── 3. Server-Side Coupon Verification ──────────────────────────────────
    let verifiedDiscount = 0
    let verifiedCouponCode: string | null = null

    if (couponCode && typeof couponCode === "string") {
      const cleanCode = couponCode.trim().toUpperCase()
      const dbCoupon = await prisma.coupon.findUnique({
        where: { code: cleanCode },
      })

      if (
        dbCoupon &&
        dbCoupon.isActive &&
        (!dbCoupon.expiresAt || new Date(dbCoupon.expiresAt) > new Date()) &&
        verifiedSubtotal >= dbCoupon.minOrderValue
      ) {
        if (dbCoupon.discountType === "PERCENT") {
          verifiedDiscount = (verifiedSubtotal * dbCoupon.discountValue) / 100
          if (dbCoupon.maxDiscount && verifiedDiscount > dbCoupon.maxDiscount) {
            verifiedDiscount = dbCoupon.maxDiscount
          }
        } else {
          verifiedDiscount = dbCoupon.discountValue
        }
        verifiedDiscount = Math.min(verifiedDiscount, verifiedSubtotal)
        verifiedCouponCode = dbCoupon.code
      }
    }

    // ── 4. Recalculate Verified Shipping & Final Payable Amount ─────────────
    const taxableSubtotal = verifiedSubtotal - verifiedDiscount
    const verifiedShipping = taxableSubtotal >= 999 ? 0 : 99
    const verifiedTotal = Math.max(0, Math.round(taxableSubtotal + verifiedShipping))

    const orderNumber = generateOrderNumber()
    const deliveryEstimate = calculateDeliveryEstimate(customer?.pincode)

    // ── 5. Atomic Stock Deduction & Low-Stock Alerts ────────────────────────
    const stockThreshold = getLowStockThreshold()

    for (const item of verifiedItems) {
      if (item.variantId) {
        try {
          const updatedVariant = await prisma.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: { decrement: item.quantity },
            },
          })

          // Check if variant stock drops to or below alert threshold
          if (updatedVariant.stock <= stockThreshold) {
            sendLowStockAlertEmail({
              productName: item.productName,
              variantName: item.flavor || item.size || undefined,
              remainingStock: Math.max(0, updatedVariant.stock),
              threshold: stockThreshold,
              sku: item.sku,
            }).catch((err) => console.warn("Low stock alert notice:", err))
          }
        } catch (stockErr: any) {
          console.warn(`Atomic stock decrement notice for variant ${item.variantId}:`, stockErr?.message)
        }
      }
    }

    // ── 6. Persist Order & Payment Record in MongoDB Atlas ──────────────────
    let savedOrder: any = null

    try {
      const atlasOperation = (async () => {
        // Resolve or create user account
        let userId = session?.user?.id
        if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
          const existing = await prisma.user.findUnique({ where: { email: cleanEmail } })
          if (existing) {
            userId = existing.id
          } else {
            const newUser = await prisma.user.create({
              data: {
                name: customerName,
                email: cleanEmail,
                phone: cleanPhone,
                role: "USER",
              },
            })
            userId = newUser.id
          }
        }

        // Save delivery address
        const address = await prisma.address.create({
          data: {
            userId: userId!,
            name: customerName,
            phone: cleanPhone,
            houseFlat: customer?.houseFlat || "Address",
            street: customer?.street || "Main Street",
            city: customer?.city || "City",
            state: customer?.state || "State",
            pincode: customer?.pincode || "400001",
            country: customer?.country || "India",
          },
        })

        // CRITICAL: Status is PLACED, PaymentStatus is PENDING (never marked as PAID automatically)
        const orderStatus = validMethod === "COD" ? "CONFIRMED" : "PLACED"
        const paymentStatus = "PENDING"

        return await prisma.order.create({
          data: {
            orderNumber,
            userId: userId!,
            addressId: address.id,
            status: orderStatus,
            deliveryStatus: "ORDER_PLACED",
            estimatedDelivery: deliveryEstimate.estimatedDeliveryDate,
            estimatedDeliveryDate: deliveryEstimate.estimatedDeliveryDate,
            deliveryStatusHistory: [
              {
                status: "ORDER_PLACED",
                timestamp: new Date().toISOString(),
                note: `Order placed (${validMethod === "UPI" ? "Payment Pending Verification" : "Cash on Delivery"}). Estimated delivery by ${deliveryEstimate.formattedDate}`,
              },
            ],
            paymentMethod: validMethod,
            paymentStatus: paymentStatus,
            subtotal: verifiedSubtotal,
            discountAmount: verifiedDiscount,
            couponCode: verifiedCouponCode,
            shippingAmount: verifiedShipping,
            totalAmount: verifiedTotal,
            customerEmail: cleanEmail,
            customerPhone: cleanPhone,
            items: {
              create: verifiedItems.map((it) => ({
                productId: it.productId,
                variantId: it.variantId,
                quantity: it.quantity,
                price: it.price,
                productName: it.productName,
                flavor: it.flavor,
                size: it.size,
              })),
            },
            payment: {
              create: {
                amount: verifiedTotal,
                currency: "INR",
                status: "PENDING",
                method: validMethod,
                transactionId: upiTransactionId || `UPI_PENDING_${Date.now()}`,
              },
            },
          },
          include: { items: true, address: true, payment: true },
        })
      })()

      savedOrder = await withFastTimeout(atlasOperation, null, 4000)
    } catch (dbErr: any) {
      console.warn("⚠️ MongoDB Atlas order placement notice:", dbErr?.message)
      savedOrder = null
    }

    // Track coupon usage
    if (verifiedCouponCode) {
      prisma.coupon
        .update({
          where: { code: verifiedCouponCode },
          data: { usedCount: { increment: 1 } },
        })
        .catch(() => {})
    }

    // Always maintain local fallback store in sync
    const orderBackupPayload = {
      id: savedOrder?.id || `ord_${Date.now()}`,
      orderNumber,
      status: validMethod === "COD" ? "CONFIRMED" : "PLACED",
      paymentMethod: validMethod,
      paymentStatus: "PENDING",
      subtotal: verifiedSubtotal,
      discountAmount: verifiedDiscount,
      couponCode: verifiedCouponCode,
      shippingAmount: verifiedShipping,
      totalAmount: verifiedTotal,
      customer: {
        name: customerName,
        email: cleanEmail,
        phone: cleanPhone,
      },
      address: {
        name: customerName,
        phone: cleanPhone,
        houseFlat: customer?.houseFlat || "",
        street: customer?.street || "",
        city: customer?.city || "",
        state: customer?.state || "",
        pincode: customer?.pincode || "",
        country: customer?.country || "India",
      },
      items: verifiedItems,
      estimatedDeliveryDate: deliveryEstimate.estimatedDeliveryDate.toISOString(),
      deliveryStatus: "ORDER_PLACED",
      createdAt: new Date().toISOString(),
    }
    saveBackupOrder(orderBackupPayload)

    // ── 7. Send Order Notification Emails ───────────────────────────────────
    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_EMAIL || "adnankazi275@gmail.com"
      const isUpi = validMethod === "UPI"

      const itemsListHtml = verifiedItems
        .map(
          (item) => `
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">
              <strong style="color: #0f172a;">${item.productName}</strong>
              ${item.size ? `<br><span style="color: #64748b; font-size: 11px;">Size: ${item.size}</span>` : ""}
              ${item.flavor ? `<br><span style="color: #64748b; font-size: 11px;">Flavor: ${item.flavor}</span>` : ""}
            </td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; color: #334155;">${item.quantity}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; color: #334155;">₹${item.price}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0f172a;">₹${item.price * item.quantity}</td>
          </tr>`
        )
        .join("")

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #09090b; padding: 22px 24px; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ff5722;">NEW ORDER PLACED (${isUpi ? "PAYMENT PENDING VERIFICATION" : "CASH ON DELIVERY"})</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Order #${orderNumber}</p>
          </div>
          
          <div style="padding: 24px; color: #1e293b;">
            <p style="font-size: 14px; margin: 0 0 16px 0;">Customer: <strong style="color: #0f172a;">${customerName}</strong></p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #0f172a;">Order & Payment Details:</h3>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Email:</strong> ${cleanEmail}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Phone:</strong> ${cleanPhone || "N/A"}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Payment Method:</strong> ${validMethod}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Payment Status:</strong> <span style="color: #d97706; font-weight: bold;">PAYMENT PENDING VERIFICATION</span></p>
              ${upiTransactionId ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Customer UTR / Txn Reference:</strong> <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${upiTransactionId}</code></p>` : ""}
              <p style="margin: 4px 0; font-size: 13px;"><strong>Delivery Address:</strong> ${[customer?.houseFlat, customer?.street, customer?.city, customer?.state, customer?.pincode].filter(Boolean).join(", ") || "N/A"}</p>
            </div>

            <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #0f172a;">Items:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
              <thead>
                <tr style="background-color: #f1f5f9; text-align: left;">
                  <th style="padding: 10px; border: 1px solid #e2e8f0;">Item</th>
                  <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">Qty</th>
                  <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">Price</th>
                  <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsListHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 8px 10px; text-align: right; border: 1px solid #e2e8f0;">Subtotal:</td>
                  <td style="padding: 8px 10px; text-align: right; border: 1px solid #e2e8f0;">₹${verifiedSubtotal}</td>
                </tr>
                ${verifiedDiscount > 0 ? `
                <tr>
                  <td colspan="3" style="padding: 8px 10px; text-align: right; border: 1px solid #e2e8f0; color: #16a34a;">Discount (${verifiedCouponCode}):</td>
                  <td style="padding: 8px 10px; text-align: right; border: 1px solid #e2e8f0; color: #16a34a;">-₹${verifiedDiscount}</td>
                </tr>` : ""}
                <tr>
                  <td colspan="3" style="padding: 8px 10px; text-align: right; border: 1px solid #e2e8f0;">Shipping:</td>
                  <td style="padding: 8px 10px; text-align: right; border: 1px solid #e2e8f0;">${verifiedShipping === 0 ? "FREE" : `₹${verifiedShipping}`}</td>
                </tr>
                <tr style="background-color: #f8fafc; font-weight: bold;">
                  <td colspan="3" style="padding: 12px 10px; text-align: right; border: 1px solid #e2e8f0; font-size: 14px;">Total Payable:</td>
                  <td style="padding: 12px 10px; text-align: right; border: 1px solid #e2e8f0; font-size: 16px; color: #ff5722;">₹${verifiedTotal}</td>
                </tr>
              </tfoot>
            </table>

            <p style="font-size: 12px; color: #64748b;">
              ⚠️ <strong>Note:</strong> Check your bank/UPI app for received funds before marking this order as PAID in the <a href="http://localhost:3000/admin/orders" style="color: #2563eb; font-weight: 600;">Admin Dashboard</a>.
            </p>
          </div>
        </div>
      `

      sendMail(adminEmail, `🚨 [Order Placed] #${orderNumber} — ₹${verifiedTotal} (${validMethod}: Pending Verification)`, emailHtml).catch(() => {})
      // Also send customer copy acknowledging order placement
      sendMail(cleanEmail, `Order Placed #${orderNumber} — NUTRA TEIN`, emailHtml).catch(() => {})
    } catch (mailErr: any) {
      console.warn("Order email alert notice:", mailErr?.message)
    }

    const finalOrderId = savedOrder?.id || orderBackupPayload.id
    const finalOrderStatus = savedOrder?.status || orderBackupPayload.status

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId: finalOrderId,
      order: {
        id: finalOrderId,
        orderNumber,
        status: finalOrderStatus,
        paymentStatus: "PENDING",
        totalAmount: verifiedTotal,
        subtotal: verifiedSubtotal,
        discountAmount: verifiedDiscount,
        shippingAmount: verifiedShipping,
        paymentMethod: validMethod,
      },
      totalAmount: verifiedTotal,
      subtotal: verifiedSubtotal,
      discountAmount: verifiedDiscount,
      shippingAmount: verifiedShipping,
      paymentMethod: validMethod,
      paymentStatus: "PENDING",
      status: finalOrderStatus,
      message:
        validMethod === "UPI"
          ? "Order placed successfully. Payment is pending admin verification."
          : "Order placed successfully.",
    })
  } catch (err: any) {
    console.error("Checkout processing error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to process checkout" },
      { status: 500 }
    )
  }
}