import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generateOrderNumber } from "@/lib/utils"
import { calculateDeliveryEstimate } from "@/lib/delivery-estimate"
import { sendMail } from "@/lib/sendEmail"
import { saveBackupOrder } from "@/lib/orders-store"
import { withFastTimeout } from "@/lib/fast-data"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const {
      customer,
      items,
      paymentMethod,
      subtotal,
      shippingAmount,
      totalAmount,
      upiTransactionId,
      discountAmount = 0,
      couponCode = null,
    } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    const cleanEmail = (customer?.email || "").toLowerCase().trim()
    if (!cleanEmail) {
      return NextResponse.json({ error: "Customer email is required" }, { status: 400 })
    }

    const orderNumber = generateOrderNumber()
    const validMethod = paymentMethod === "COD" ? "COD" : "UPI"
    const deliveryEstimate = calculateDeliveryEstimate(customer?.pincode)

    const resolvedItems = items.map((i: any, index: number) => ({
      id: `item_${Date.now()}_${index}`,
      productId: i.productId || "prod-default",
      variantId: i.variantId || null,
      quantity: Number(i.quantity) || 1,
      price: Number(i.price) || 0,
      productName: i.productName || "Nutratein Formula",
      flavor: i.flavor || null,
      size: i.size || null,
    }))

    const orderPayload = {
      orderNumber,
      status: "CONFIRMED",
      paymentMethod: validMethod,
      paymentStatus: validMethod === "COD" ? "PENDING" : "PAID",
      subtotal: Number(subtotal),
      discountAmount: Number(discountAmount || 0),
      couponCode: couponCode || null,
      shippingAmount: Number(shippingAmount || 0),
      totalAmount: Number(totalAmount),
      items: resolvedItems,
      customer: {
        name: customer.name || "Customer",
        email: cleanEmail,
        phone: customer.phone || "",
      },
      address: {
        name: customer.name || "Customer",
        phone: customer.phone || "",
        houseFlat: customer.houseFlat || "",
        street: customer.street || "",
        city: customer.city || "",
        state: customer.state || "",
        pincode: customer.pincode || "",
        country: customer.country || "India",
      },
      estimatedDeliveryDate: deliveryEstimate.estimatedDeliveryDate.toISOString(),
      deliveryStatus: "ORDER_PLACED",
      createdAt: new Date().toISOString(),
    }

    let savedOrder: any = null

    // 1. Try saving directly to MongoDB Atlas
    try {
      const atlasOperation = (async () => {
        let userId = session?.user?.id
        if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
          const existing = await prisma.user.findUnique({ where: { email: cleanEmail } })
          if (existing) {
            userId = existing.id
          } else {
            const newUser = await prisma.user.create({
              data: {
                name: customer.name || "Customer",
                email: cleanEmail,
                phone: customer.phone || "",
                role: "USER",
              },
            })
            userId = newUser.id
          }
        }

        const address = await prisma.address.create({
          data: {
            userId: userId!,
            name: customer.name || "Valued Athlete",
            phone: customer.phone || "",
            houseFlat: customer.houseFlat || "Address",
            street: customer.street || "Main Street",
            city: customer.city || "City",
            state: customer.state || "State",
            pincode: customer.pincode || "400001",
            country: customer.country || "India",
          },
        })

        // Resolve hex product ID for Atlas
        const defaultProduct = await prisma.product.findFirst()
        const dbItems = resolvedItems.map((it: any) => {
          const isHex = typeof it.productId === "string" && /^[0-9a-fA-F]{24}$/.test(it.productId)
          return {
            productId: isHex ? it.productId : defaultProduct?.id,
            variantId: typeof it.variantId === "string" && /^[0-9a-fA-F]{24}$/.test(it.variantId) ? it.variantId : null,
            quantity: it.quantity,
            price: it.price,
            productName: it.productName,
            flavor: it.flavor,
            size: it.size,
          }
        })

        return await prisma.order.create({
          data: {
            orderNumber,
            userId: userId!,
            addressId: address.id,
            status: "CONFIRMED",
            deliveryStatus: "ORDER_PLACED",
            estimatedDelivery: deliveryEstimate.estimatedDeliveryDate,
            estimatedDeliveryDate: deliveryEstimate.estimatedDeliveryDate,
            deliveryStatusHistory: [
              {
                status: "ORDER_PLACED",
                timestamp: new Date().toISOString(),
                note: `Order placed. Estimated delivery by ${deliveryEstimate.formattedDate} (${deliveryEstimate.zoneName})`,
              },
            ],
            paymentMethod: validMethod,
            paymentStatus: validMethod === "COD" ? "PENDING" : "PAID",
            subtotal: Number(subtotal),
            discountAmount: Number(discountAmount || 0),
            couponCode: couponCode || null,
            shippingAmount: Number(shippingAmount || 0),
            totalAmount: Number(totalAmount),
            customerEmail: cleanEmail,
            customerPhone: customer.phone || "",
            items: { create: dbItems },
            payment: {
              create: {
                amount: Number(totalAmount),
                currency: "INR",
                status: validMethod === "COD" ? "PENDING" : "PAID",
                method: validMethod,
                transactionId: upiTransactionId || `TXN_${Date.now()}`,
              },
            },
          },
          include: { items: true, address: true },
        })
      })()

      savedOrder = await withFastTimeout(atlasOperation, null, 2500)
    } catch (dbErr: any) {
      console.warn("⚠️ MongoDB Atlas connection notice:", dbErr?.message)
      savedOrder = null
    }

    if (savedOrder) {
      console.log(`✅ Order ${savedOrder.orderNumber} successfully saved to MongoDB Atlas (ID: ${savedOrder.id})`)
      saveBackupOrder({
        id: savedOrder.id,
        ...orderPayload,
      })
      if (couponCode) {
        prisma.coupon.update({
          where: { code: couponCode },
          data: { usedCount: { increment: 1 } },
        }).catch(() => {})
      }
    } else {
      savedOrder = {
        id: `ord_${Date.now()}`,
        ...orderPayload,
      }
      saveBackupOrder(savedOrder)
    }

    // 2. Call sendMail() to notify ADMIN_EMAIL with clean HTML
    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_EMAIL || "adnankazi275@gmail.com"
      const itemsListHtml = (savedOrder.items || resolvedItems)
        .map(
          (item: any) => `
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
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ff5722; letter-spacing: 0.5px;">NEW ORDER RECEIVED!</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Order ID: <strong>${savedOrder.id}</strong> (Order #${savedOrder.orderNumber})</p>
          </div>
          
          <div style="padding: 24px; color: #1e293b;">
            <p style="font-size: 14px; margin: 0 0 16px 0;">A new order has been placed by <strong style="color: #0f172a;">${customer.name || "Customer"}</strong>.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Customer & Delivery Details:</h3>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Customer Name:</strong> ${customer.name || "N/A"}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Customer Email:</strong> <a href="mailto:${cleanEmail}" style="color: #2563eb;">${cleanEmail}</a></p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Customer Phone:</strong> ${customer.phone ? `<a href="tel:${customer.phone}" style="color: #2563eb;">${customer.phone}</a>` : "N/A"}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Delivery Address:</strong> ${[customer.houseFlat, customer.street, customer.city, customer.state, customer.pincode].filter(Boolean).join(", ") || "N/A"}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Payment Method:</strong> ${savedOrder.paymentMethod} (${savedOrder.paymentStatus || "PENDING"})</p>
            </div>

            <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #0f172a;">Items Ordered:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
              <thead>
                <tr style="background-color: #f1f5f9; text-align: left;">
                  <th style="padding: 10px; border: 1px solid #e2e8f0;">Item</th>
                  <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">Qty</th>
                  <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">Price</th>
                  <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsListHtml}
              </tbody>
              <tfoot>
                <tr style="background-color: #f8fafc;">
                  <td colspan="3" style="padding: 12px; font-weight: 700; text-align: right; border: 1px solid #e2e8f0; font-size: 14px;">Total Amount:</td>
                  <td style="padding: 12px; font-weight: 800; text-align: right; border: 1px solid #e2e8f0; color: #ff5722; font-size: 16px;">₹${savedOrder.totalAmount}</td>
                </tr>
              </tfoot>
            </table>

            <div style="text-align: center; margin-top: 24px; padding-top: 18px; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #64748b; margin-bottom: 12px;">Manage and fulfill this order live in your admin panel:</p>
              <a href="http://localhost:3000/admin/orders" style="display: inline-block; background-color: #ff5722; color: #ffffff; text-decoration: none; padding: 10px 22px; border-radius: 6px; font-size: 13px; font-weight: 700;">Open Admin Orders Panel</a>
            </div>
          </div>
        </div>
      `

      // Call sendMail asynchronously without blocking or failing the order
      sendMail(
        adminEmail,
        `🚨 New Order #${savedOrder.orderNumber} (ID: ${savedOrder.id}) - ₹${savedOrder.totalAmount} from ${customer.name || "Customer"}`,
        emailHtml
      ).catch((mailErr) => {
        console.error("❌ [sendMail] Error sending order email notification:", mailErr?.message || mailErr)
      })

      // Send Customer Order Confirmation Email & log WhatsApp update readiness
      import("@/lib/notification-service").then(({ sendCustomerOrderConfirmationEmail }) => {
        sendCustomerOrderConfirmationEmail({
          orderNumber: savedOrder.orderNumber,
          totalAmount: savedOrder.totalAmount,
          customerName: customer.name || "Customer",
          customerEmail: cleanEmail,
          customerPhone: customer.phone || "",
          estimatedDelivery: deliveryEstimate.formattedDate,
          items: resolvedItems,
        }).catch((err) => console.error("Customer confirmation email notice:", err))
      })
    } catch (emailPrepErr) {
      console.error("❌ [sendMail] Error preparing order notification email:", emailPrepErr)
    }

    return NextResponse.json({ message: "Order placed successfully", order: savedOrder })
  } catch (err: any) {
    console.error("Checkout processing error:", err)
    return NextResponse.json({ error: err.message || "Failed to process checkout" }, { status: 500 })
  }
}