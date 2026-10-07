import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import fs from "fs"
import path from "path"

const REVIEWS_FILE = path.join(process.cwd(), "src", "data", "site-reviews.json")

function getReviews() {
  try {
    if (fs.existsSync(REVIEWS_FILE)) {
      return JSON.parse(fs.readFileSync(REVIEWS_FILE, "utf-8"))
    }
  } catch (err) {}
  return []
}

function saveReviews(reviews: any[]) {
  try {
    const dir = path.dirname(REVIEWS_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), "utf-8")
  } catch (err) {}
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const reviews = getReviews()
    return NextResponse.json({ reviews })
  } catch (err: any) {
    return NextResponse.json({ reviews: [] })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id, status } = await req.json()
    const reviews = getReviews()
    const idx = reviews.findIndex((r: any) => String(r.id) === String(id))
    if (idx > -1) {
      reviews[idx].status = status
      saveReviews(reviews)
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
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
    let reviews = getReviews()
    reviews = reviews.filter((r: any) => r.id !== id)
    saveReviews(reviews)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
