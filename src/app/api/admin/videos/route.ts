import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import fs from "fs"
import path from "path"

const VIDEOS_FILE = path.join(process.cwd(), "src/data/videos.json")

function getVideosData() {
  try {
    if (!fs.existsSync(VIDEOS_FILE)) {
      return { videos: [] }
    }
    return JSON.parse(fs.readFileSync(VIDEOS_FILE, "utf-8"))
  } catch (err) {
    console.error("Error reading videos data:", err)
    return { videos: [] }
  }
}

export async function GET() {
  const data = getVideosData()
  return NextResponse.json({ success: true, videos: data.videos || [] })
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const current = getVideosData()
    let videos = current.videos || []

    if (body.videos) {
      videos = body.videos
    } else if (body.video) {
      const v = body.video
      const idx = videos.findIndex((x: any) => x.id === v.id)
      if (idx >= 0) {
        videos[idx] = { ...videos[idx], ...v }
      } else {
        videos.unshift({
          id: v.id || `vid-${Date.now()}`,
          title: v.title || "Influencer Video Showcase",
          tagline: v.tagline || "",
          kicker: v.kicker || "FEATURED REEL",
          videoUrl: v.videoUrl || "",
          poster: v.poster || "/assets/top-sellers/shredtein-lean-protein.png",
          productId: v.productId || "shred-tein-whey",
          productSlug: v.productSlug || "shred-tein-whey",
          productName: v.productName || "ShredTein Lean Protein Matrix",
          productImage: v.productImage || v.poster || "/assets/top-sellers/shredtein-lean-protein.png",
          creator: v.creator || "Verified Athlete",
          badge: v.badge || "INFLUENCER",
          badgeVariant: v.badgeVariant || "gold",
          price: Number(v.price) || 2499,
          mrp: Number(v.mrp) || 2999,
          servings: v.servings || "30 Servings",
          isTopSeller: v.isTopSeller ?? true,
          isActive: v.isActive ?? true,
          sortOrder: videos.length + 1,
        })
      }
    }

    fs.writeFileSync(VIDEOS_FILE, JSON.stringify({ videos }, null, 2), "utf-8")
    return NextResponse.json({ success: true, message: "Videos updated successfully", videos })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save video" }, { status: 500 })
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
    if (!id) return NextResponse.json({ error: "Video ID required" }, { status: 400 })

    const current = getVideosData()
    const videos = (current.videos || []).filter((v: any) => v.id !== id)

    fs.writeFileSync(VIDEOS_FILE, JSON.stringify({ videos }, null, 2), "utf-8")
    return NextResponse.json({ success: true, message: "Video removed", videos })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete video" }, { status: 500 })
  }
}
