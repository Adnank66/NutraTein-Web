import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/security"
import { prisma } from "@/lib/prisma"
import { getFeatureFlags, saveFeatureFlags } from "@/lib/feature-flags"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

const LOYALTY_CONFIG_FILE = path.join(process.cwd(), "src", "data", "loyalty-config.json")

function getLoyaltyConfig() {
  try {
    if (fs.existsSync(LOYALTY_CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(LOYALTY_CONFIG_FILE, "utf-8"))
    }
  } catch {}
  return {
    enabled: true,
    pointsPerRupee: 1,
    minOrderAmount: 500,
    maxPointsPerOrder: 500,
    redeemRate: 100,
    redeemValue: 10,
    expirationDays: 365,
    expirationEnabled: false,
  }
}

function saveLoyaltyConfig(config: any) {
  const dir = path.dirname(LOYALTY_CONFIG_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(LOYALTY_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8")
}

export async function GET(req: Request) {
  const guard = await requireAdmin()
  if (!guard.authorized) return guard.errorResponse!

  const { searchParams } = new URL(req.url)
  const subStatus = searchParams.get("subStatus") || "ALL"

  try {
    // 1. Feature flags
    const flags = getFeatureFlags()

    // 2. Loyalty config & accounts
    const loyaltyConfig = getLoyaltyConfig()
    loyaltyConfig.enabled = flags.enableLoyalty

    let loyaltyAccounts: any[] = []
    try {
      const rawAccounts = await (prisma as any).loyaltyAccount.findMany({
        take: 100,
        orderBy: { points: "desc" },
      })
      const userIds = rawAccounts.map((a: any) => a.userId)
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      })
      const userMap = Object.fromEntries(users.map(u => [u.id, u]))
      loyaltyAccounts = rawAccounts.map((a: any) => ({
        ...a,
        user: userMap[a.userId] || null,
      }))
    } catch (e: any) {
      console.warn("Could not load loyalty accounts:", e.message)
    }

    // 3. Subscriptions
    let subscriptions: any[] = []
    try {
      const where: any = {}
      if (subStatus && subStatus !== "ALL") where.status = subStatus

      const rawSubs = await (prisma as any).subscription.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
      })

      const subUserIds = rawSubs.map((s: any) => s.userId)
      const subProdIds = rawSubs.map((s: any) => s.productId)

      const [subUsers, subProducts] = await Promise.all([
        prisma.user.findMany({
          where: { id: { in: subUserIds } },
          select: { id: true, name: true, email: true },
        }),
        prisma.product.findMany({
          where: { id: { in: subProdIds } },
          select: { id: true, name: true },
        }),
      ])

      const sUserMap = Object.fromEntries(subUsers.map(u => [u.id, u]))
      const sProdMap = Object.fromEntries(subProducts.map(p => [p.id, p]))

      subscriptions = rawSubs.map((s: any) => ({
        ...s,
        user: sUserMap[s.userId] || null,
        product: sProdMap[s.productId] || null,
      }))
    } catch (e: any) {
      console.warn("Could not load subscriptions:", e.message)
    }

    return NextResponse.json({
      success: true,
      flags,
      loyaltyConfig,
      loyaltyAccounts,
      subscriptions,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch data" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (!guard.authorized) return guard.errorResponse!

  try {
    const body = await req.json()
    const { action } = body

    // 1. Toggle feature flags
    if (action === "toggle_flags") {
      const { enableSubscriptions, enableLoyalty } = body
      const updated = saveFeatureFlags({ enableSubscriptions, enableLoyalty })
      return NextResponse.json({ success: true, flags: updated })
    }

    // 2. Save loyalty config
    if (action === "update_loyalty_config") {
      const current = getLoyaltyConfig()
      const merged = { ...current, ...body.config }
      saveLoyaltyConfig(merged)
      return NextResponse.json({ success: true, loyaltyConfig: merged })
    }

    // 3. Manual loyalty points adjustment
    if (action === "adjust_points") {
      const { userId, points, reason } = body
      if (!userId || typeof points !== "number" || !reason) {
        return NextResponse.json({ error: "userId, points, and reason are required" }, { status: 400 })
      }

      let account = await (prisma as any).loyaltyAccount.findUnique({ where: { userId } })
      if (!account) {
        account = await (prisma as any).loyaltyAccount.create({ data: { userId } })
      }

      const balanceBefore = account.points
      const balanceAfter = Math.max(0, balanceBefore + points)

      await (prisma as any).loyaltyAccount.update({
        where: { userId },
        data: {
          points: balanceAfter,
          totalEarned: points > 0 ? account.totalEarned + points : account.totalEarned,
          totalRedeemed: points < 0 ? account.totalRedeemed + Math.abs(points) : account.totalRedeemed,
        },
      })

      await (prisma as any).loyaltyTransaction.create({
        data: {
          userId,
          amount: points,
          type: "ADJUSTED",
          description: reason,
          balanceBefore,
          balanceAfter,
        },
      })

      return NextResponse.json({ success: true, newBalance: balanceAfter })
    }

    // 4. Update subscription status
    if (action === "update_subscription_status") {
      const { id, status } = body
      if (!id || !status) {
        return NextResponse.json({ error: "id and status required" }, { status: 400 })
      }
      await (prisma as any).subscription.update({
        where: { id },
        data: { status },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process request" }, { status: 500 })
  }
}
