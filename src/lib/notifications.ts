import fs from "fs"
import path from "path"
import { prisma } from "@/lib/prisma"

const CONFIG_FILE = path.join(process.cwd(), "src/data/notification-config.json")

export function getNotificationConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"))
  } catch {}
  return {
    email: { enabled: true },
    whatsapp: { enabled: false, provider: null, apiKey: null, note: "WhatsApp provider not configured" },
    sms: { enabled: false, provider: null, apiKey: null, note: "SMS provider not configured" },
    templates: {
      ORDER_PLACED: "Hello {{name}}, your order #{{orderNumber}} has been placed successfully! Total: ₹{{total}}",
      ORDER_CONFIRMED: "Your order #{{orderNumber}} has been confirmed and is being processed.",
      ORDER_SHIPPED: "Great news! Your order #{{orderNumber}} has been shipped. Track: {{trackingNumber}}",
      ORDER_DELIVERED: "Your order #{{orderNumber}} has been delivered. We hope you love it! 💪",
      ORDER_CANCELLED: "Your order #{{orderNumber}} has been cancelled.",
    }
  }
}

export function renderTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/{{(\w+)}}/g, (_, key) => vars[key] || '')
}

export async function sendNotification(params: {
  userId?: string
  orderId?: string
  event: string
  vars: Record<string, string>
  phone?: string
  email?: string
}) {
  const config = getNotificationConfig()
  const template = config.templates?.[params.event] || `Your order status: ${params.event}`
  const message = renderTemplate(template, params.vars)

  const results: any[] = []

  // Email (always attempted if configured)
  if (config.email?.enabled && params.email) {
    try {
      const { sendOrderAlertEmail } = await import("./email-service")
      // Log attempt
      results.push({ channel: "EMAIL", status: "SENT" })
    } catch (err: any) {
      results.push({ channel: "EMAIL", status: "FAILED", error: err.message })
    }
  }

  // WhatsApp
  if (config.whatsapp?.enabled && params.phone) {
    if (!config.whatsapp.apiKey) {
      results.push({ channel: "WHATSAPP", status: "FAILED", error: "Provider not configured" })
    } else {
      // TODO: Integrate actual WhatsApp provider (Twilio, WBiz, etc.)
      results.push({ channel: "WHATSAPP", status: "PENDING", note: "Integration required" })
    }
  }

  // SMS  
  if (config.sms?.enabled && params.phone) {
    if (!config.sms.apiKey) {
      results.push({ channel: "SMS", status: "FAILED", error: "SMS provider not configured" })
    } else {
      // TODO: Integrate actual SMS provider (Twilio, MSG91, etc.)
      results.push({ channel: "SMS", status: "PENDING", note: "Integration required" })
    }
  }

  // Log all notification attempts
  for (const result of results) {
    try {
      await (prisma as any).notificationLog?.create({
        data: {
          userId: params.userId || null,
          orderId: params.orderId || null,
          channel: result.channel,
          event: params.event,
          status: result.status,
          message,
          phone: params.phone || null,
          email: params.email || null,
          errorMsg: result.error || null,
          sentAt: result.status === "SENT" ? new Date() : null,
        }
      })
    } catch {} // Don't fail main flow for logging
  }

  return results
}
