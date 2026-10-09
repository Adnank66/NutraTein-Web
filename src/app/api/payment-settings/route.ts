import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

const settingsFilePath = path.join(process.cwd(), "src", "data", "payment-settings.json")

function ensureDir() {
  const dir = path.dirname(settingsFilePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function getLocalSettings() {
  try {
    if (fs.existsSync(settingsFilePath)) {
      return JSON.parse(fs.readFileSync(settingsFilePath, "utf8"))
    }
  } catch (err) {
    console.error("Error reading local payment settings:", err)
  }
  return {
    upiId: "proteinx@upi",
    upiName: "PROTEINX Supplements Official",
    qrCodeImage: "/assets/payment/upi-qr.svg",
    instructions: "Scan the QR code with any UPI app (Google Pay, PhonePe, Paytm, BHIM) and enter the 12-digit UTR/Txn reference below.",
    enabled: true,
    enableCOD: true,
    enableUPI: true,
    enableCash: false,
    customMethods: [],
  }
}

export async function GET() {
  const localSettings = getLocalSettings()
  try {
    // Attempt to load primary active UPI payment method from MongoDB Atlas
    const dbDefaultUPI = await prisma.paymentMethod.findFirst({
      where: { isActive: true },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    })

    if (dbDefaultUPI) {
      localSettings.upiId = dbDefaultUPI.upiId
      localSettings.upiName = dbDefaultUPI.payeeName
      localSettings.qrCodeImage = dbDefaultUPI.qrImageUrl
      if (dbDefaultUPI.instructions) {
        localSettings.instructions = dbDefaultUPI.instructions
      }
    }
  } catch (err: any) {
    console.warn("MongoDB PaymentMethod fetch notice:", err?.message)
  }

  return NextResponse.json({ success: true, settings: localSettings })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const current = getLocalSettings()
    const updated = {
      ...current,
      ...(body.upiId !== undefined && { upiId: body.upiId }),
      ...(body.upiName !== undefined && { upiName: body.upiName }),
      ...(body.qrCodeImage !== undefined && {
        qrCodeImage: String(body.qrCodeImage).trim().replace(/\\/g, "/"),
      }),
      ...(body.instructions !== undefined && { instructions: body.instructions }),
      ...(body.enabled !== undefined && { enabled: body.enabled }),
      ...(body.enableCOD !== undefined && { enableCOD: body.enableCOD }),
      ...(body.enableUPI !== undefined && { enableUPI: body.enableUPI }),
      ...(body.enableCash !== undefined && { enableCash: body.enableCash }),
      ...(body.customMethods !== undefined && { customMethods: body.customMethods }),
    }

    // Persist to local cache
    ensureDir()
    fs.writeFileSync(settingsFilePath, JSON.stringify(updated, null, 2), "utf8")

    // Synchronize to MongoDB Atlas PaymentMethod collection
    if (updated.upiId && updated.upiName) {
      try {
        const existingDefault = await prisma.paymentMethod.findFirst({
          where: { isDefault: true },
        })

        if (existingDefault) {
          await prisma.paymentMethod.update({
            where: { id: existingDefault.id },
            data: {
              upiId: updated.upiId,
              payeeName: updated.upiName,
              qrImageUrl: updated.qrCodeImage || "/assets/payment/upi-qr.svg",
              instructions: updated.instructions,
              isActive: updated.enableUPI !== false,
            },
          })
        } else {
          await prisma.paymentMethod.create({
            data: {
              upiId: updated.upiId,
              payeeName: updated.upiName,
              qrImageUrl: updated.qrCodeImage || "/assets/payment/upi-qr.svg",
              instructions: updated.instructions,
              isDefault: true,
              isActive: updated.enableUPI !== false,
              label: "Primary Store UPI",
            },
          })
        }
      } catch (dbErr: any) {
        console.warn("MongoDB PaymentMethod sync notice:", dbErr?.message)
      }
    }

    return NextResponse.json({ success: true, settings: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
