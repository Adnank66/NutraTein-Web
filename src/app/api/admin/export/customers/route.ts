import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    where: { role: "USER" },
    include: {
      orders: { select: { totalAmount: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10000,
  })

  // Try to get loyalty accounts
  let loyaltyMap: Record<string, number> = {}
  try {
    const loyaltyAccounts = await (prisma as any).loyaltyAccount?.findMany({ select: { userId: true, points: true } }) || []
    loyaltyMap = Object.fromEntries(loyaltyAccounts.map((a: any) => [a.userId, a.points]))
  } catch {}

  const rows = users.map(u => {
    const completedOrders = u.orders.filter(o => o.status === "DELIVERED")
    const totalSpend = completedOrders.reduce((s, o) => s + o.totalAmount, 0)
    return {
      "User ID": u.id,
      "Name": u.name || "",
      "Email": u.email,
      "Phone": u.phone || "",
      "Total Orders": u.orders.length,
      "Completed Orders": completedOrders.length,
      "Total Spend (₹)": totalSpend.toFixed(2),
      "Loyalty Points": loyaltyMap[u.id] || 0,
      "Joined": new Date(u.createdAt).toLocaleDateString("en-IN"),
    }
  })

  const headers = Object.keys(rows[0] || {})
  if (headers.length === 0) return new NextResponse("No data", { status: 404 })

  const csvLines = [
    headers.join(","),
    ...rows.map(row =>
      headers.map(h => {
        const val = String((row as any)[h] || "")
        return val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val
      }).join(",")
    ),
  ]

  return new NextResponse(csvLines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-export-${Date.now()}.csv"`,
    },
  })
}
