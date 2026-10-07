import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

const CONFIG_FILE = path.join(process.cwd(), "src/data/loyalty-config.json")

function getLoyaltyConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"))
    }
  } catch {}
  return { enabled: false, pointsPerRupee: 1, minOrderAmount: 500, maxPointsPerOrder: 500, redeemRate: 100, redeemValue: 10 }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })

    let account = await prisma.loyaltyAccount.findUnique({ where: { userId: user.id } })
    if (!account) {
      account = await prisma.loyaltyAccount.create({ data: { userId: user.id } })
    }

    const transactions = await prisma.loyaltyTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const config = getLoyaltyConfig()

    return NextResponse.json({
      success: true,
      account,
      transactions,
      config: {
        redeemRate: config.redeemRate,
        redeemValue: config.redeemValue,
        enabled: config.enabled,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
