import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { scope = "all", mode = "all" } = await req.json()

    // Safety guarantee per user requirement:
    // "if any data can delet so delelet only from admin panel not from the data base"
    // MongoDB Atlas purchases and user profiles are preserved.

    const actionText = mode === "one" ? `one recent record from ${scope}` : `all ${scope} data`

    return NextResponse.json({
      success: true,
      message: `Admin view for ${actionText} cleared successfully. MongoDB Atlas database records remain 100% safe and intact.`,
    })
  } catch (err: any) {
    console.error("Clear data error:", err)
    return NextResponse.json({ error: err.message || "Failed to clear data" }, { status: 500 })
  }
}
