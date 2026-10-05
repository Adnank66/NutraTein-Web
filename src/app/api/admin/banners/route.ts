import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import fs from "fs"
import path from "path"
import { revalidatePath } from "next/cache"

const BANNERS_FILE = path.join(process.cwd(), "src/data/banners.json")

function getBannersData() {
  try {
    if (!fs.existsSync(BANNERS_FILE)) {
      return { activeBannerId: "ban-whey", fitMode: "contain", banners: [] }
    }
    return JSON.parse(fs.readFileSync(BANNERS_FILE, "utf-8"))
  } catch (err) {
    console.error("Error reading banners:", err)
    return { activeBannerId: "ban-whey", fitMode: "contain", banners: [] }
  }
}

export async function GET() {
  const data = getBannersData()
  return NextResponse.json({ success: true, ...data })
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const current = getBannersData()

    let updated = { ...current }

    if (body.banners) {
      updated.banners = body.banners
    }
    if (body.activeBannerId) {
      updated.activeBannerId = body.activeBannerId
    }
    if (body.fitMode) {
      updated.fitMode = body.fitMode
    }
    if (body.bannerWidth) {
      updated.bannerWidth = body.bannerWidth
    }
    if (body.bannerHeight) {
      updated.bannerHeight = body.bannerHeight
    }
    if (body.banner) {
      // Add or update single banner
      const b = body.banner
      const idx = updated.banners.findIndex((x: any) => x.id === b.id)
      if (idx >= 0) {
        updated.banners[idx] = { ...updated.banners[idx], ...b }
      } else {
        updated.banners.unshift({
          id: b.id || `ban-${Date.now()}`,
          ...b,
          isActive: b.isActive ?? true,
          sortOrder: updated.banners.length + 1,
        })
      }
    }

    fs.writeFileSync(BANNERS_FILE, JSON.stringify(updated, null, 2), "utf-8")
    try {
      revalidatePath("/")
      revalidatePath("/admin/banners")
    } catch {}
    return NextResponse.json({ success: true, message: "Banners updated successfully", ...updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save banners" }, { status: 500 })
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
    if (!id) return NextResponse.json({ error: "Banner ID required" }, { status: 400 })

    const current = getBannersData()
    current.banners = current.banners.filter((b: any) => b.id !== id)
    if (current.activeBannerId === id) {
      current.activeBannerId = current.banners[0]?.id || ""
    }

    fs.writeFileSync(BANNERS_FILE, JSON.stringify(current, null, 2), "utf-8")
    try {
      revalidatePath("/")
      revalidatePath("/admin/banners")
    } catch {}
    return NextResponse.json({ success: true, message: "Banner deleted", ...current })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete banner" }, { status: 500 })
  }
}
