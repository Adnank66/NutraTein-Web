import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const startTime = Date.now()
  try {
    // Perform a lightweight query on MongoDB Atlas to verify active connectivity
    const productCount = await prisma.product.count()
    const latencyMs = Date.now() - startTime

    return NextResponse.json({
      database: "MongoDB Atlas",
      connected: true,
      latencyMs,
      timestamp: new Date().toISOString(),
      catalogStatus: {
        totalProducts: productCount,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        database: "MongoDB Atlas",
        connected: false,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: "Database connectivity check failed",
      },
      { status: 500 }
    )
  }
}
