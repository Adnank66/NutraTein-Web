import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

const CONFIG_FILE = path.join(process.cwd(), "src/data/loyalty-config.json")

function getLoyaltyConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"))
  } catch {}
  return { enabled: false, redeemRate: 100, redeemValue: 10 }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    
    const { pointsToRedeem } = await req.json()
    const points = parseInt(String(pointsToRedeem))
    if (!points || points <= 0) return NextResponse.json({ error: "Invalid points" }, { status: 400 })

    const config = getLoyaltyConfig()
    if (!config.enabled) return NextResponse.json({ error: "Loyalty program not active" }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const account = await prisma.loyaltyAccount.findUnique({ where: { userId: user.id } })
    if (!account || account.points < points) {
      return NextResponse.json({ error: "Insufficient points" }, { status: 400 })
    }

    // Server calculates discount
    const discountAmount = Math.floor(points / config.redeemRate) * config.redeemValue

    return NextResponse.json({
      success: true,
      pointsToRedeem: points,
      discountAmount,
      availablePoints: account.points,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
