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
  return { enabled: true, pointsPerRupee: 1, minOrderAmount: 500, maxPointsPerOrder: 500, redeemRate: 100, redeemValue: 10, expirationDays: 365, expirationEnabled: false }
}

function saveLoyaltyConfig(config: any) {
  const dir = path.dirname(CONFIG_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8")
}

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const config = getLoyaltyConfig()
  const accounts = await prisma.loyaltyAccount.findMany({
    take: 100,
    orderBy: { points: "desc" },
  })

  // Get user info for each account
  const userIds = accounts.map(a => a.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  })
  const userMap = Object.fromEntries(users.map(u => [u.id, u]))

  const enriched = accounts.map(a => ({ ...a, user: userMap[a.userId] || null }))

  return NextResponse.json({ success: true, config, accounts: enriched })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  // Save config update
  if (body.action === "update_config") {
    const current = getLoyaltyConfig()
    saveLoyaltyConfig({ ...current, ...body.config })
    return NextResponse.json({ success: true })
  }

  // Manual points adjustment
  if (body.action === "adjust_points") {
    const { userId, points, reason } = body
    if (!userId || !points || !reason) {
      return NextResponse.json({ error: "userId, points, and reason required" }, { status: 400 })
    }

    let account = await prisma.loyaltyAccount.findUnique({ where: { userId } })
    if (!account) {
      account = await prisma.loyaltyAccount.create({ data: { userId } })
    }

    const balanceBefore = account.points
    const newBalance = Math.max(0, account.points + points)

    await prisma.loyaltyAccount.update({
      where: { userId },
      data: {
        points: newBalance,
        totalEarned: points > 0 ? account.totalEarned + points : account.totalEarned,
      },
    })

    await prisma.loyaltyTransaction.create({
      data: {
        userId,
        points,
        type: "ADJUSTED",
        reason,
        adminId: (session.user as any)?.id || null,
        balanceBefore,
        balanceAfter: newBalance,
      },
    })

    return NextResponse.json({ success: true, newBalance })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
