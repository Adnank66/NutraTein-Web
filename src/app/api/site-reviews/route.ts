import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { auth } from "@/lib/auth"

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

export async function POST(req: Request) {
  try {
    const { rating, title, body, name, email } = await req.json()
    const reviews = getReviews()
    
    const session = await auth()
    const reviewerName = session?.user?.name || name || "Customer"
    const reviewerEmail = session?.user?.email || email || ""
    
    const newReview = {
      id: Date.now().toString(),
      rating: Number(rating) || 5,
      title: title || "",
      body: body || "",
      status: "PENDING",
      isVerified: !!session,
      createdAt: new Date().toISOString(),
      user: {
        name: reviewerName,
        email: reviewerEmail
      },
      product: {
        name: "Store Review",
        slug: ""
      }
    }
    
    reviews.push(newReview)
    saveReviews(reviews)
    
    return NextResponse.json({ success: true, message: "Review submitted for approval!" })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
