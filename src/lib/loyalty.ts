import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

const CONFIG_FILE = path.join(process.cwd(), "src/data/loyalty-config.json")

export function getLoyaltyConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"))
  } catch {}
  return { enabled: false, pointsPerRupee: 1, minOrderAmount: 500, maxPointsPerOrder: 500, redeemRate: 100, redeemValue: 10 }
}

export async function awardLoyaltyPoints(userId: string, orderId: string, orderAmount: number) {
  const config = getLoyaltyConfig()
  if (!config.enabled) return null
  if (orderAmount < config.minOrderAmount) return null

  // Check if points already awarded for this order
  const existing = await prisma.loyaltyTransaction.findFirst({
    where: { userId, orderId, type: "EARNED" },
  })
  if (existing) return null // Prevent duplicate awarding

  let pointsEarned = Math.floor(orderAmount * config.pointsPerRupee)
  if (config.maxPointsPerOrder > 0) {
    pointsEarned = Math.min(pointsEarned, config.maxPointsPerOrder)
  }

  let account = await prisma.loyaltyAccount.findUnique({ where: { userId } })
  if (!account) {
    account = await prisma.loyaltyAccount.create({ data: { userId } })
  }

  const balanceBefore = account.points
  const balanceAfter = account.points + pointsEarned

  await prisma.loyaltyAccount.update({
    where: { userId },
    data: {
      points: balanceAfter,
      totalEarned: account.totalEarned + pointsEarned,
    },
  })

  await prisma.loyaltyTransaction.create({
    data: {
      userId,
      orderId,
      points: pointsEarned,
      type: "EARNED",
      reason: `Points earned for order`,
      balanceBefore,
      balanceAfter,
    },
  })

  return pointsEarned
}

export async function reverseLoyaltyPoints(userId: string, orderId: string) {
  const transaction = await prisma.loyaltyTransaction.findFirst({
    where: { userId, orderId, type: "EARNED" },
  })
  if (!transaction) return null

  let account = await prisma.loyaltyAccount.findUnique({ where: { userId } })
  if (!account) return null

  const pointsToReverse = transaction.points
  const balanceBefore = account.points
  const balanceAfter = Math.max(0, account.points - pointsToReverse)

  await prisma.loyaltyAccount.update({
    where: { userId },
    data: { points: balanceAfter },
  })

  await prisma.loyaltyTransaction.create({
    data: {
      userId,
      orderId,
      points: -pointsToReverse,
      type: "REVERSED",
      reason: "Order cancelled/refunded",
      balanceBefore,
      balanceAfter,
    },
  })

  return pointsToReverse
}
