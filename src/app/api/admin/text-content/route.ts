import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

const LOCALES_DIR = path.join(process.cwd(), "src", "locales")

export async function GET() {
  const result: Record<string, any> = {}
  for (const lang of ["en", "hi", "mr", "ta"]) {
    const filePath = path.join(LOCALES_DIR, `${lang}.json`)
    try {
      result[lang] = JSON.parse(fs.readFileSync(filePath, "utf-8"))
    } catch {
      result[lang] = {}
    }
  }
  return NextResponse.json({ success: true, locales: result })
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { lang, key, value } = await req.json()
    if (!lang || !key) {
      return NextResponse.json({ error: "lang and key required" }, { status: 400 })
    }

    const filePath = path.join(LOCALES_DIR, `${lang}.json`)
    const current = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, "utf-8"))
      : {}

    // Support nested keys like 'home.title'
    const keys = key.split(".")
    let obj = current
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]] || typeof obj[keys[i]] !== "object") obj[keys[i]] = {}
      obj = obj[keys[i]]
    }
    obj[keys[keys.length - 1]] = value

    fs.writeFileSync(filePath, JSON.stringify(current, null, 2), "utf-8")
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
