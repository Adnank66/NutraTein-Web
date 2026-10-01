import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type (Images + Packaging Videos)
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v", "video/ogg", "video/3gpp"]
    const isVideo = allowedVideoTypes.includes(file.type) || file.type.startsWith("video/")
    const isImage = allowedImageTypes.includes(file.type) || file.type.startsWith("image/")

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Invalid file type. Only standard images and video formats (MP4, WebM, MOV) are allowed." },
        { status: 400 }
      )
    }

    // Max 10MB for images, Max 100MB for videos
    const maxSizeBytes = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: `File too large. Max ${isVideo ? "100MB for videos" : "10MB for images"} allowed.` },
        { status: 400 }
      )
    }

    // Create safe filename
    const ext = file.name.split(".").pop()?.toLowerCase() || (isVideo ? "mp4" : "png")
    const subfolder = isVideo ? "videos" : "images"
    const safeName = `${isVideo ? "video" : "upload"}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder)
    await mkdir(uploadDir, { recursive: true })

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(path.join(uploadDir, safeName), buffer)

    const publicUrl = `/uploads/${subfolder}/${safeName}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: safeName,
      originalName: file.name,
      size: file.size,
      type: file.type,
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
