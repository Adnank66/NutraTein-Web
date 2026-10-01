import { NextResponse } from "next/server"
import { sendContactAlertEmail } from "@/lib/email-service"

export async function POST(req: Request) {
  try {
    const { name, email, phone, subject, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 })
    }

    console.log(`📩 New Contact Message from ${name} (${email}): ${message.slice(0, 60)}...`)

    // Send email alert to adnankazi275@gmail.com
    sendContactAlertEmail({
      name,
      email,
      phone,
      subject,
      message,
    }).catch((err) => console.error("Contact alert email background error:", err.message))

    return NextResponse.json({
      success: true,
      message: "Your message has been sent directly to our support desk.",
    })
  } catch (err: any) {
    console.error("Contact API error:", err)
    return NextResponse.json({ error: err.message || "Failed to process message" }, { status: 500 })
  }
}
