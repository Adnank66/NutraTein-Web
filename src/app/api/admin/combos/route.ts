import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
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
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { combos } = await req.json()
    fs.writeFileSync(dataFile, JSON.stringify(combos, null, 2))
    return NextResponse.json({ success: true, combos })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
