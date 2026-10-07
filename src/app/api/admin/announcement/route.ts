import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import fs from "fs"
import path from "path"

export const dynamic = 'force-dynamic'

const SETTINGS_FILE = path.join(process.cwd(), "src/data/store-settings.json")

export interface RibbonItem {
  id: string
  text: string
  badge?: string
  link?: string
  bgColor?: string
  textColor?: string
  enabled: boolean
}

const DEFAULT_RIBBONS: RibbonItem[] = [
  {
    id: "ribbon-1",
    text: "⚡ FLASH SALE: 20% OFF ALL SUPPLEMENTS | USE CODE 'PROTEIN20' | FREE EXPRESS SHIPPING OVER ₹999",
    badge: "LIMITED TIME",
    link: "/shop",
    bgColor: "bg-red-600",
    textColor: "text-white",
    enabled: true,
  },
  {
    id: "ribbon-2",
    text: "🛡️ 100% AUTHENTIC INDIAN BATCH LAB CERTIFIED | NO AMINO SPIKING | HASSLE-FREE 7-DAY REPLACEMENTS",
    badge: "LAB CERTIFIED",
    link: "/about",
    bgColor: "bg-zinc-950",
    textColor: "text-zinc-200",
    enabled: true,
  },
  {
    id: "ribbon-3",
    text: "NEW LAUNCH | NITROTEIN WHEY ISOLATE NOW AVAILABLE | Shop Now",
    badge: "NEW",
    link: "/shop",
    bgColor: "bg-amber-600",
    textColor: "text-white",
    enabled: false,
  },
]

function getSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      return {
        ribbons: DEFAULT_RIBBONS,
        announcement: DEFAULT_RIBBONS[0],
        announcementPrimary: DEFAULT_RIBBONS[0],
        announcementSecondary: DEFAULT_RIBBONS[1],
        supportPhone: "+91 9321598094",
        supportEmail: "adnankazi275@gmail.com",
        freeShippingThreshold: 999,
        socialLinks: {
          instagram: "https://www.instagram.com/nutratein?stkn=MXd0ODBqMWs0ZmRvMA==",
          youtube: "https://www.youtube.com/@nutratein",
          facebook: "https://www.facebook.com/nutratein",
        },
      }
    }
    const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"))

    // Ensure ribbons array exists with all 3 defaults
    if (!data.ribbons || !Array.isArray(data.ribbons) || data.ribbons.length === 0) {
      data.ribbons = [
        {
          id: "ribbon-1",
          text: data.announcementPrimary?.text || data.announcement?.text || DEFAULT_RIBBONS[0].text,
          badge: data.announcementPrimary?.badge || data.announcement?.badge || "LIMITED TIME",
          link: data.announcementPrimary?.link || data.announcement?.link || "/shop",
          bgColor: data.announcementPrimary?.bgColor || data.announcement?.bgColor || "bg-red-600",
          enabled: data.announcementPrimary?.enabled ?? true,
        },
        {
          id: "ribbon-2",
          text: data.announcementSecondary?.text || DEFAULT_RIBBONS[1].text,
          badge: data.announcementSecondary?.badge || "LAB CERTIFIED",
          link: data.announcementSecondary?.link || "/about",
          bgColor: data.announcementSecondary?.bgColor || "bg-zinc-950",
          enabled: data.announcementSecondary?.enabled ?? true,
        },
        { ...DEFAULT_RIBBONS[2] },
      ]
    } else if (!data.ribbons.find((r: RibbonItem) => r.id === "ribbon-3")) {
      // Existing data missing ribbon-3 — add it
      data.ribbons.push({ ...DEFAULT_RIBBONS[2] })
    }


    return data
  } catch (err) {
    console.error("Error reading store settings:", err)
    return null
  }
}

export async function GET() {
  const settings = getSettings()
  return NextResponse.json({
    success: true,
    settings,
    ribbons: settings?.ribbons || DEFAULT_RIBBONS,
  })
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const current = getSettings() || {}
    let ribbons: RibbonItem[] = current.ribbons || [...DEFAULT_RIBBONS]

    if (body.ribbons && Array.isArray(body.ribbons)) {
      ribbons = body.ribbons
    } else if (body.ribbon) {
      const r = body.ribbon
      const idx = ribbons.findIndex((x) => x.id === r.id)
      if (idx >= 0) {
        ribbons[idx] = { ...ribbons[idx], ...r }
      } else {
        ribbons.push({
          id: r.id || `ribbon-${Date.now()}`,
          text: r.text || "",
          badge: r.badge || "PROMO",
          link: r.link || "/shop",
          bgColor: r.bgColor || "bg-red-600",
          textColor: r.textColor || "text-white",
          enabled: r.enabled ?? true,
        })
      }
    }

    // Mirror to announcementPrimary and announcementSecondary for backwards compatibility
    const primary = ribbons[0] || DEFAULT_RIBBONS[0]
    const secondary = ribbons[1] || DEFAULT_RIBBONS[1]

    const updated = {
      ...current,
      ...body,
      ribbons,
      announcement: primary,
      announcementPrimary: primary,
      announcementSecondary: secondary,
      updatedAt: new Date().toISOString(),
    }

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), "utf-8")
    return NextResponse.json({
      success: true,
      message: "Ribbon announcements updated successfully",
      settings: updated,
      ribbons,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update settings" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Ribbon ID required" }, { status: 400 })

    const current = getSettings() || {}
    const ribbons = (current.ribbons || []).filter((r: RibbonItem) => r.id !== id)

    const updated = {
      ...current,
      ribbons,
      announcement: ribbons[0] || null,
      announcementPrimary: ribbons[0] || null,
      announcementSecondary: ribbons[1] || null,
      updatedAt: new Date().toISOString(),
    }

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), "utf-8")
    return NextResponse.json({
      success: true,
      message: "Ribbon deleted successfully",
      ribbons,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete ribbon" }, { status: 500 })
  }
}
