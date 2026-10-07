import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "Email and password (min 6 chars) required" }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { email: email.trim().toLowerCase() },
      data: { password: hashed },
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
