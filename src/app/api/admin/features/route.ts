import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { requireAdmin } from "@/lib/security"

export const dynamic = "force-dynamic"

const FEATURES_FILE = path.join(process.cwd(), "src", "data", "site-features.json")

const DEFAULT_FEATURES = [
  { id: "f1", icon: "🧪", title: "100% Lab Tested", desc: "Every batch third-party certified", enabled: true },
  { id: "f2", icon: "🚚", title: "Free Express Shipping", desc: "On orders above ₹999", enabled: true },
  { id: "f3", icon: "🔄", title: "7-Day Returns", desc: "Hassle-free replacement guarantee", enabled: true },
  { id: "f4", icon: "🛡️", title: "FSSAI Certified", desc: "Indian food safety compliant", enabled: true },
]

function getFeatures() {
  try {
    if (fs.existsSync(FEATURES_FILE)) {
      return JSON.parse(fs.readFileSync(FEATURES_FILE, "utf-8"))
    }
  } catch {}
  return DEFAULT_FEATURES
}

export async function GET() {
  return NextResponse.json({ success: true, features: getFeatures() })
}

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (!guard.authorized) return guard.errorResponse!

  try {
    const { features } = await req.json()
    if (!Array.isArray(features)) {
      return NextResponse.json({ error: "Features payload must be an array" }, { status: 400 })
    }
    const dir = path.dirname(FEATURES_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(FEATURES_FILE, JSON.stringify(features, null, 2), "utf-8")
    return NextResponse.json({ success: true, features })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update features" }, { status: 500 })
  }
}
