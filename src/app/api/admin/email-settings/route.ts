import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sendMail } from "@/lib/sendEmail"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

const SETTINGS_FILE = path.join(process.cwd(), "data", "email-settings.json")

function getSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"))
    }
  } catch {}
  return {
    primaryEmail: "adnankazi275@gmail.com",
    secondaryEmail: "admin@proteinx.in",
    lowStockThreshold: 20,
    notifyNewOrders: true,
    notifyLowStock: true,
    notifyReturns: true,
    notifyContactForm: true,
  }
}

function saveSettings(data: any) {
  try {
    const dir = path.dirname(SETTINGS_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), "utf-8")
  } catch (err) {
    console.error("Failed to save email settings:", err)
  }
}

export async function GET() {
  return NextResponse.json({ success: true, settings: getSettings() })
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Test Email Action
    if (body.action === "send_test") {
      const target = body.targetEmail || "adnankazi275@gmail.com"
      const res = await sendMail(
        target,
        "🔔 [PROTEINX Live Test] Email Notification Delivery Verified",
        `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #09090b; padding: 20px; color: #ffffff;">
            <h2 style="margin: 0; color: #ea580c; font-size: 20px;">PROTEINX STORE ALERT SYSTEM</h2>
            <p style="margin: 4px 0 0 0; color: #a1a1aa; font-size: 12px;">Test Message Dispatched</p>
          </div>
          <div style="padding: 24px; color: #18181b;">
            <p style="font-size: 14px;">Hello <strong>Adnan Kazi</strong>,</p>
            <p style="font-size: 13px; line-height: 1.5; color: #52525b;">
              Your store notification pipeline is configured correctly! You will receive instant alerts for every new order placed, customer inquiry, and inventory threshold events directly at <strong>${target}</strong>.
            </p>
            <div style="background-color: #f4f4f5; padding: 12px 16px; border-radius: 8px; font-size: 12px; margin: 18px 0;">
              <p style="margin: 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString("en-IN")}</p>
              <p style="margin: 4px 0 0 0;"><strong>Active Recipient:</strong> ${target}</p>
            </div>
            <p style="font-size: 11px; color: #71717a;">Sent automatically from PROTEINX Web Store Admin Panel.</p>
          </div>
        </div>
        `
      )
      return NextResponse.json({ success: true, mailResult: res })
    }

    // Save Settings
    const updated = { ...getSettings(), ...body }
    saveSettings(updated)

    return NextResponse.json({ success: true, settings: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
