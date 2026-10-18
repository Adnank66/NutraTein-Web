import { NextResponse } from "next/server"
import { sendContactAlertEmail } from "@/lib/email-service"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    // 1. IP-based Rate Limiting (5 requests per 10 minutes)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "127.0.0.1"

    const rateResult = checkRateLimit(`contact_${ip}`, 5, 10 * 60 * 1000)
    if (!rateResult.success) {
      return NextResponse.json(
        { error: "Too many messages sent. Please wait a few minutes before trying again." },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { name, email, phone, subject, message, hp_company } = body

    // 2. Honeypot check — bots that populate invisible fields are silently dropped
    if (hp_company) {
      console.warn(`🤖 Bot caught by contact form honeypot from IP ${ip}`)
      return NextResponse.json({
        success: true,
        message: "Your message has been received.",
      })
    }

    // 3. Strict Server-Side Validation
    if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json(
        { error: "Please provide a valid name between 2 and 100 characters." },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim()) || email.trim().length > 100) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      )
    }

    if (!message || typeof message !== "string" || message.trim().length < 10 || message.trim().length > 3000) {
      return NextResponse.json(
        { error: "Please write a message between 10 and 3,000 characters." },
        { status: 400 }
      )
    }

    const sanitizedName = name.trim()
    const sanitizedEmail = email.trim().toLowerCase()
    const sanitizedPhone = typeof phone === "string" ? phone.trim().slice(0, 20) : ""
    const sanitizedSubject = typeof subject === "string" ? subject.trim().slice(0, 150) : "General Inquiry"
    const sanitizedMessage = message.trim()

    console.log(`📩 Verified Contact Message from ${sanitizedName} (${sanitizedEmail}): ${sanitizedMessage.slice(0, 60)}...`)

    // Send email alert to support desk
    sendContactAlertEmail({
      name: sanitizedName,
      email: sanitizedEmail,
      phone: sanitizedPhone,
      subject: sanitizedSubject,
      message: sanitizedMessage,
    }).catch((err) => console.error("Contact alert email background error:", err?.message))

    return NextResponse.json({
      success: true,
      message: "Your message has been sent directly to our support desk.",
    })
  } catch (err: any) {
    console.error("Contact API error:", err)
    return NextResponse.json(
      { error: err?.message || "Failed to process message" },
      { status: 500 }
    )
  }
}
