import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/security"
import fs from "fs"
import path from "path"

const dataFile = path.join(process.cwd(), "src", "data", "combos.json")

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = fs.readFileSync(dataFile, "utf8")
    return NextResponse.json({ combos: JSON.parse(data) })
  } catch {
    return NextResponse.json({ combos: [] })
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireAdmin()
    if (!guard.authorized) return guard.errorResponse!

    const { combos } = await req.json()
    fs.writeFileSync(dataFile, JSON.stringify(combos, null, 2))
    return NextResponse.json({ success: true, combos })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
