import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const format = searchParams.get("format") || "csv"

  const where: any = {}
  if (status && status !== "ALL") where.status = status
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = new Date(from)
    if (to) where.createdAt.lte = new Date(to)
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: true,
      address: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10000,
  })

  const rows = orders.map(o => ({
    "Order ID": o.orderNumber,
    "Customer Name": o.user?.name || "",
    "Email": o.customerEmail || o.user?.email || "",
    "Phone": o.customerPhone || "",
    "Products": o.items.map(i => `${i.productName} x${i.quantity}`).join(" | "),
    "Subtotal (₹)": o.subtotal,
    "Discount (₹)": o.discountAmount,
    "Shipping (₹)": o.shippingAmount,
    "Tax (₹)": o.taxAmount,
    "Total (₹)": o.totalAmount,
    "Payment Method": o.paymentMethod,
    "Payment Status": o.paymentStatus,
    "Order Status": o.status,
    "City": o.address?.city || "",
    "State": o.address?.state || "",
    "Pincode": o.address?.pincode || "",
    "Date": new Date(o.createdAt).toLocaleDateString("en-IN"),
  }))

  // Build CSV
  if (rows.length === 0) {
    return new NextResponse("No data found", { status: 404 })
  }

  const headers = Object.keys(rows[0])
  const csvLines = [
    headers.join(","),
    ...rows.map(row =>
      headers.map(h => {
        const val = String((row as any)[h] || "")
        return val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val
      }).join(",")
    ),
  ]

  const csv = csvLines.join("\n")
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-export-${Date.now()}.csv"`,
    },
  })
}
