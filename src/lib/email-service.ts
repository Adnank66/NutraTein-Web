import nodemailer from "nodemailer"
import fs from "fs"
import path from "path"

const SETTINGS_FILE = path.join(process.cwd(), "data", "email-settings.json")

function getTargetEmail() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"))
      if (settings.primaryEmail) return settings.primaryEmail
    }
  } catch {}
  return process.env.ALERT_EMAIL || "adnankazi275@gmail.com"
}

function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com"
  const port = Number(process.env.SMTP_PORT) || 587
  const user = process.env.SMTP_EMAIL || process.env.SMTP_USER || process.env.EMAIL_USER
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASS

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    })
  }

  return null
}

function logAlertFallback(type: string, data: any) {
  try {
    const logDir = path.join(process.cwd(), "logs")
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
    const logFile = path.join(logDir, "email-alerts.log")
    const entry = `[${new Date().toISOString()}] [${type}] To: ${getTargetEmail()}\n${JSON.stringify(data, null, 2)}\n\n`
    fs.appendFileSync(logFile, entry, "utf8")
    console.log(`📧 [EMAIL ALERT: ${type}] Saved to logs/email-alerts.log -> To: ${getTargetEmail()}`)
  } catch (err) {
    console.error("Failed to write email alert log:", err)
  }
}

export async function sendOrderAlertEmail(order: {
  orderNumber: string
  totalAmount: number
  paymentMethod: string
  customer: { name: string; email: string; phone: string }
  address: { houseFlat?: string; street?: string; city?: string; state?: string; pincode?: string }
  items: Array<{ productName: string; quantity: number; price: number; flavor?: string; size?: string }>
}) {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${item.productName}</strong> ${item.size ? `(${item.size})` : ""} ${item.flavor ? `[${item.flavor}]` : ""}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
      </tr>`
    )
    .join("")

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #09090b; padding: 20px; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; color: #ff5722;">NUTRA TEIN — NEW ORDER RECEIVED!</h1>
        <p style="margin: 5px 0 0 0; font-size: 13px; color: #a1a1aa;">Order #${order.orderNumber}</p>
      </div>

      <div style="padding: 24px;">
        <h2 style="font-size: 16px; margin-top: 0;">Order Summary: ₹${order.totalAmount} (${order.paymentMethod})</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <thead>
            <tr style="background-color: #f4f4f5;">
              <th style="padding: 8px; text-align: left;">Product</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; font-weight: bold; text-align: right;">Total Amount:</td>
              <td style="padding: 10px; font-weight: bold; text-align: right; color: #ff5722; font-size: 16px;">₹${order.totalAmount}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background-color: #fafafa; padding: 15px; border-radius: 6px; margin-bottom: 15px; font-size: 13px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #18181b;">Customer & Delivery Details:</h3>
          <p style="margin: 3px 0;"><strong>Name:</strong> ${order.customer.name}</p>
          <p style="margin: 3px 0;"><strong>Phone:</strong> <a href="tel:${order.customer.phone}">${order.customer.phone}</a></p>
          <p style="margin: 3px 0;"><strong>Email:</strong> ${order.customer.email}</p>
          <p style="margin: 3px 0;"><strong>Address:</strong> ${order.address.houseFlat || ""}, ${order.address.street || ""}, ${order.address.city || ""}, ${order.address.state || ""} - ${order.address.pincode || ""}</p>
        </div>

        <p style="font-size: 12px; color: #71717a; margin-bottom: 0;">
          This is an automated notification from your NUTRA TEIN Web Storefront. Manage this order live at: <a href="http://localhost:3000/admin/orders">Admin Dashboard</a>
        </p>
      </div>
    </div>
  `

  logAlertFallback("NEW_ORDER", order)

  const transporter = getTransporter()
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"NUTRA TEIN Store" <${process.env.SMTP_USER || "orders@nutratein.in"}>`,
        to: getTargetEmail(),
        subject: `🚨 [New Order #${order.orderNumber}] ₹${order.totalAmount} from ${order.customer.name}`,
        html,
      })
      console.log(`✅ [ORDER EMAIL ALERT SENT] To: ${getTargetEmail()}`)
    } catch (err: any) {
      console.error("Failed to send order email alert via SMTP:", err.message)
    }
  }
}

export async function sendContactAlertEmail(contact: {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #09090b; padding: 20px; color: #ffffff;">
        <h1 style="margin: 0; font-size: 18px; color: #ff5722;">NUTRA TEIN — NEW CONTACT MESSAGE</h1>
      </div>

      <div style="padding: 24px; font-size: 13px;">
        <p><strong>From:</strong> ${contact.name} (&lt;${contact.email}&gt;)</p>
        ${contact.phone ? `<p><strong>Phone:</strong> <a href="tel:${contact.phone}">${contact.phone}</a></p>` : ""}
        ${contact.subject ? `<p><strong>Subject:</strong> ${contact.subject}</p>` : ""}
        
        <div style="background-color: #f4f4f5; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p style="margin: 0; white-space: pre-wrap;">${contact.message}</p>
        </div>

        <p style="font-size: 12px; color: #71717a;">
          Reply directly to this customer at <a href="mailto:${contact.email}">${contact.email}</a>.
        </p>
      </div>
    </div>
  `

  logAlertFallback("CONTACT_MESSAGE", contact)

  const transporter = getTransporter()
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"NUTRA TEIN Inquiries" <${process.env.SMTP_USER || "inquiries@nutratein.in"}>`,
        to: getTargetEmail(),
        replyTo: contact.email,
        subject: `📩 [Contact Inquiry] From ${contact.name}: ${contact.subject || "Customer Message"}`,
        html,
      })
      console.log(`✅ [CONTACT EMAIL ALERT SENT] To: ${getTargetEmail()}`)
    } catch (err: any) {
      console.error("Failed to send contact email alert via SMTP:", err.message)
    }
  }
}
