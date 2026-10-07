import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/sendEmail'

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()
    
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 })
    }

    const cleanDigits = phone.replace(/[^0-9]/g, '')
    if (cleanDigits.length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number' }, { status: 400 })
    }

    const cleanPhone = cleanDigits.slice(-10)
    const intlPhone = `+91${cleanPhone}`

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Clean up previous OTPs for this phone
    await prisma.phoneOTP.deleteMany({
      where: { phone: { contains: cleanPhone } }
    }).catch(() => {})

    // Store in DB
    await prisma.phoneOTP.create({
      data: {
        phone: cleanPhone,
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
      }
    })

    const messageText = `Your NUTRA TEIN verification code is ${otp}. Valid for 10 minutes. Do not share this code.`

    // Try Fast2SMS gateway if configured in environment
    if (process.env.FAST2SMS_API_KEY) {
      try {
        await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            "authorization": process.env.FAST2SMS_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            route: "otp",
            variables_values: otp,
            numbers: cleanPhone
          })
        })
      } catch (e) {
        console.warn('Fast2SMS send error:', e)
      }
    }

    // Try Twilio SMS gateway if configured in environment
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const authHeader = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: intlPhone,
            From: process.env.TWILIO_PHONE_NUMBER,
            Body: messageText
          }).toString()
        })
      } catch (e) {
        console.warn('Twilio send error:', e)
      }
    }

    // If user has email linked to this phone, also send backup email OTP
    const user = await prisma.user.findFirst({
      where: { phone: { contains: cleanPhone } }
    })
    if (user && user.email) {
      await prisma.emailOTP.create({
        data: {
          email: user.email.toLowerCase().trim(),
          code: otp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        }
      }).catch(() => {})
      
      sendMail(
        user.email,
        `🔑 ${otp} — Your NUTRA TEIN Login Code`,
        `<p>Your login verification code for mobile number ${cleanPhone} is: <strong>${otp}</strong> (valid for 10 minutes).</p>`
      ).catch(() => {})
    }

    // Build direct Native SMS App Link and WhatsApp Web Link for the user
    // Android/iOS SMS intent: sms:+919876543210?&body=...
    const smsLink = `sms:${intlPhone}?&body=${encodeURIComponent(messageText)}`
    const waLink = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(messageText)}`

    return NextResponse.json({
      success: true,
      message: 'Verification code generated.',
      otp,
      devCode: otp,
      smsLink,
      waLink,
      phone: cleanPhone
    })
  } catch (error: any) {
    console.error('Phone OTP error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 500 })
  }
}
