import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const settingsFilePath = path.join(process.cwd(), "src", "data", "payment-settings.json")

function ensureDir() {
  const dir = path.dirname(settingsFilePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function getSettings() {
  try {
    if (fs.existsSync(settingsFilePath)) {
      return JSON.parse(fs.readFileSync(settingsFilePath, "utf8"))
    }
  } catch (err) {
    console.error("Error reading payment settings:", err)
  }
  return {
    upiId: "proteinx@upi",
    upiName: "PROTEINX Supplements Official",
    qrCodeImage: "/assets/payment/upi-qr.svg",
    instructions: "Scan the QR code with any UPI app and enter the transaction reference.",
    enabled: true,
    enableCOD: true,
    enableUPI: true,
    enableCard: true,
    enableCash: false,
    razorpayEnabled: false,
  }
}

export async function GET() {
  const settings = getSettings()
  return NextResponse.json({ success: true, settings })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const current = getSettings()
    const updated = {
      ...current,
      // UPI fields
      ...(body.upiId !== undefined && { upiId: body.upiId }),
      ...(body.upiName !== undefined && { upiName: body.upiName }),
      ...(body.qrCodeImage !== undefined && {
        qrCodeImage: String(body.qrCodeImage).trim().replace(/\\/g, "/"),
      }),
      ...(body.instructions !== undefined && { instructions: body.instructions }),
      ...(body.enabled !== undefined && { enabled: body.enabled }),
      // Payment method toggles
      ...(body.enableCOD !== undefined && { enableCOD: body.enableCOD }),
      ...(body.enableUPI !== undefined && { enableUPI: body.enableUPI }),
      ...(body.enableCard !== undefined && { enableCard: body.enableCard }),
      ...(body.enableCash !== undefined && { enableCash: body.enableCash }),
      ...(body.razorpayEnabled !== undefined && { razorpayEnabled: body.razorpayEnabled }),
    }

    ensureDir()
    fs.writeFileSync(settingsFilePath, JSON.stringify(updated, null, 2), "utf8")
    return NextResponse.json({ success: true, settings: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
