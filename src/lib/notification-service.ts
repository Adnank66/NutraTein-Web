import { sendMail } from "@/lib/sendEmail"

export interface OrderNotificationPayload {
  orderNumber: string
  totalAmount: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  status?: string
  courierPartner?: string
  trackingNumber?: string
  estimatedDelivery?: string
  items?: Array<{ productName: string; quantity: number; price: number; flavor?: string; size?: string }>
}

/**
 * Generates an official WhatsApp message formatted with emojis and styling
 */
export function generateWhatsAppMessage(payload: OrderNotificationPayload): string {
  const phone = (payload.customerPhone || "").replace(/\D/g, "")
  const cleanPhone = phone.startsWith("91") && phone.length === 12 ? phone : phone.length === 10 ? `91${phone}` : phone

  const status = payload.status || "CONFIRMED"
  let statusEmoji = "📦"
  let statusText = "Order Confirmed & Processing"

  if (status === "SHIPPED") {
    statusEmoji = "🚚"
    statusText = "Shipped & In Transit"
  } else if (status === "OUT_FOR_DELIVERY") {
    statusEmoji = "⚡"
    statusText = "Out for Delivery Today"
  } else if (status === "DELIVERED") {
    statusEmoji = "🎉"
    statusText = "Delivered Successfully"
  }

  const itemsList = payload.items && payload.items.length > 0
    ? payload.items.map(i => `• ${i.productName} (Qty: ${i.quantity})`).join("\n")
    : "• NUTRA TEIN Authentic Supplements"

  const msg = 
`*NUTRA TEIN ORDER UPDATE* ${statusEmoji}

Hello *${payload.customerName}*,

Your order *#${payload.orderNumber}* status has been updated:
👉 *Status:* ${statusText}
💰 *Total Amount:* ₹${payload.totalAmount}

*Items:*
${itemsList}

${payload.courierPartner ? `🚚 *Courier:* ${payload.courierPartner}` : ""}
${payload.trackingNumber ? `📍 *Tracking ID:* ${payload.trackingNumber}` : ""}
${payload.estimatedDelivery ? `📅 *Est. Delivery:* ${payload.estimatedDelivery}` : ""}

Track live anytime on your dashboard:
🔗 ${process.env.NEXT_PUBLIC_APP_URL || "https://nutratein.in"}/account/orders

Need assistance? Reply directly to this WhatsApp message or call our support team.
*Team NUTRA TEIN India* 🇮🇳`

  return encodeURIComponent(msg)
}

/**
 * Returns a direct WhatsApp chat / web-api URL for triggering message to customer
 */
export function getWhatsAppClickUrl(payload: OrderNotificationPayload): string {
  const phone = (payload.customerPhone || "").replace(/\D/g, "")
  const cleanPhone = phone.startsWith("91") && phone.length === 12 ? phone : phone.length === 10 ? `91${phone}` : phone
  const encodedText = generateWhatsAppMessage(payload)

  return `https://wa.me/${cleanPhone}?text=${encodedText}`
}

/**
 * Sends customer order confirmation email with official branding
 */
export async function sendCustomerOrderConfirmationEmail(payload: OrderNotificationPayload) {
  try {
    if (!payload.customerEmail) return

    const itemsHtml = (payload.items || []).map(i => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
          <strong>${i.productName}</strong>
          ${i.size ? `<br><span style="color: #64748b; font-size: 11px;">Size: ${i.size}</span>` : ""}
          ${i.flavor ? `<br><span style="color: #64748b; font-size: 11px;">Flavor: ${i.flavor}</span>` : ""}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 13px;">${i.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px; font-weight: 700; color: #ff5722;">₹${i.price * i.quantity}</td>
      </tr>
    `).join("")

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #09090b; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #ff5722; letter-spacing: 1px;">
            NUTRA<span style="color: #ffffff;">TEIN</span>
          </h1>
          <p style="margin: 6px 0 0 0; font-size: 12px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1.5px;">Order Confirmation #${payload.orderNumber}</p>
        </div>

        <div style="padding: 28px 24px; color: #1e293b;">
          <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 8px 0; color: #09090b;">Thank you for your order, ${payload.customerName}!</h2>
          <p style="font-size: 13px; color: #64748b; margin: 0 0 20px 0; line-height: 1.5;">
            Your order has been confirmed and is now being packaged with 100% genuine seal authentication.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
            <p style="margin: 2px 0; font-size: 12px; color: #64748b;"><strong>Order Number:</strong> <span style="color: #09090b;">${payload.orderNumber}</span></p>
            <p style="margin: 2px 0; font-size: 12px; color: #64748b;"><strong>Estimated Delivery:</strong> <span style="color: #16a34a; font-weight: bold;">${payload.estimatedDelivery || "2-4 Business Days"}</span></p>
            ${payload.customerPhone ? `<p style="margin: 2px 0; font-size: 12px; color: #64748b;"><strong>WhatsApp Updates:</strong> <span style="color: #25d366; font-weight: bold;">Active on ${payload.customerPhone}</span></p>` : ""}
          </div>

          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #09090b;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: left;">
                <th style="padding: 8px 10px; font-size: 12px; color: #475569;">Item</th>
                <th style="padding: 8px 10px; font-size: 12px; color: #475569; text-align: center;">Qty</th>
                <th style="padding: 8px 10px; font-size: 12px; color: #475569; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 12px 10px; font-weight: 700; text-align: right; font-size: 13px;">Total Paid:</td>
                <td style="padding: 12px 10px; font-weight: 800; text-align: right; color: #ff5722; font-size: 16px;">₹${payload.totalAmount}</td>
              </tr>
            </tfoot>
          </table>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/account/orders" style="background-color: #ff5722; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 700; display: inline-block;">
              Track Order Live
            </a>
          </div>
        </div>

        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
          © ${new Date().getFullYear()} NUTRA TEIN India • Questions? WhatsApp our team anytime.
        </div>
      </div>
    `

    await sendMail(
      payload.customerEmail,
      `🎉 Order Confirmed! #${payload.orderNumber} - NUTRA TEIN`,
      html
    )
    console.log(`✅ [Customer Order Email Sent] To: ${payload.customerEmail}`)
  } catch (err: any) {
    console.error("Failed to send customer order confirmation email:", err?.message)
  }
}
