import { NextResponse } from "next/server"
import { requireUser } from "@/lib/security"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export const dynamic = "force-dynamic"

function detectImageType(buffer: Buffer): "jpg" | "png" | "webp" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg"
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png"
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "webp"
  return null
}

export async function POST(req: Request) {
  try {
    const guard = await requireUser()
    if (!guard.authorized) return guard.errorResponse!

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 })
    }

    // Only allow safe image formats for profile photos
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file format. Only JPG, PNG, and WebP profile photos are allowed." },
        { status: 400 }
      )
    }

    // Maximum 5MB for profile photos
    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: "Image file too large. Maximum profile photo size is 5MB." },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const detectedType = detectImageType(buffer)
    if (!detectedType) {
      return NextResponse.json({ error: "The upload content is not a supported image." }, { status: 400 })
    }

    // Use the validated content type rather than the user-controlled file name.
    const safeName = `avatar_${crypto.randomUUID()}.${detectedType}`
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars")
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, safeName), buffer)

    const publicUrl = `/uploads/avatars/${safeName}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
    })
  } catch (err: any) {
    console.error("Profile upload failed")
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
