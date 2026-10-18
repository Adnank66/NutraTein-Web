import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const startTime = Date.now()
  try {
    // Perform a lightweight query on MongoDB Atlas to verify active connectivity
    await prisma.product.count()
    const latencyMs = Date.now() - startTime

    return NextResponse.json({
      connected: true,
      latencyMs,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        connected: false,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: "Database connectivity check failed",
      },
      { status: 500 }
    )
  }
}
