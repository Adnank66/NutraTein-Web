import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/security"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

type DetectedUpload = {
  kind: "image" | "video"
  extension: "jpg" | "png" | "gif" | "webp" | "mp4" | "webm" | "ogg"
  mime: string
}

function detectUpload(buffer: Buffer): DetectedUpload | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { kind: "image", extension: "jpg", mime: "image/jpeg" }
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { kind: "image", extension: "png", mime: "image/png" }
  }
  if (buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))) {
    return { kind: "image", extension: "gif", mime: "image/gif" }
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return { kind: "image", extension: "webp", mime: "image/webp" }
  }
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    return { kind: "video", extension: "mp4", mime: "video/mp4" }
  }
  if (buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
    return { kind: "video", extension: "webm", mime: "video/webm" }
  }
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString("ascii") === "OggS") {
    return { kind: "video", extension: "ogg", mime: "video/ogg" }
  }
  return null
}

export async function POST(req: Request) {
  try {
    const guard = await requireAdmin()
    if (!guard.authorized) return guard.errorResponse!

    const contentLength = Number(req.headers.get("content-length") || "0")
    if (Number.isFinite(contentLength) && contentLength > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "Upload exceeds the 100MB request limit." }, { status: 413 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const detected = detectUpload(buffer)
    if (!detected) {
      return NextResponse.json(
        { error: "Invalid file content. Upload a JPEG, PNG, GIF, WebP, MP4, WebM, or Ogg file." },
        { status: 400 }
      )
    }

    // SVG is intentionally excluded: it is executable XML and should not be
    // accepted into a public, same-origin upload location.
    const maxSizeBytes = detected.kind === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: `File too large. Max ${detected.kind === "video" ? "100MB for videos" : "10MB for images"} allowed.` },
        { status: 400 }
      )
    }

    const subfolder = detected.kind === "video" ? "videos" : "images"
    const safeName = `${detected.kind === "video" ? "video" : "upload"}_${crypto.randomUUID()}.${detected.extension}`
    const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder)
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, safeName), buffer)

    const publicUrl = `/uploads/${subfolder}/${safeName}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: safeName,
      originalName: file.name,
      size: file.size,
      type: detected.mime,
    })
  } catch (err: any) {
    console.error("Upload error:", err)
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 })
  }
}

// Required for Next.js to handle multipart/form-data
export const config = {
  api: { bodyParser: false },
}
