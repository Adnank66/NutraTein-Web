import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/sendEmail'
import { generateOtp, hashOtp } from '@/lib/otp'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    const rate = checkRateLimit(`phone-otp:${getClientIdentifier(req)}`, 5, 15 * 60 * 1000)
    if (!rate.success) return NextResponse.json({ error: 'Too many verification requests. Please try again later.' }, { status: 429 })

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

    // Do not issue a usable OTP unless there is a configured delivery channel.
    const user = await prisma.user.findFirst({ where: { phone: cleanPhone } })
    const hasSmsGateway = Boolean(
      process.env.FAST2SMS_API_KEY ||
      (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER)
    )
    if (!hasSmsGateway && !user?.email) {
      return NextResponse.json(
        { error: 'Phone verification is temporarily unavailable. Please use email sign-in.' },
        { status: 503 }
      )
    }

    // Generate and persist only a cryptographic hash of the one-time password.
    const otp = generateOtp()
    
    // Clean up previous OTPs for this phone
    await prisma.phoneOTP.deleteMany({
      where: { phone: { contains: cleanPhone } }
    }).catch(() => {})

    // Store in DB
    await prisma.phoneOTP.create({
      data: {
        phone: cleanPhone,
        code: hashOtp(otp),
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
    if (user && user.email) {
      await prisma.emailOTP.create({
        data: {
          email: user.email.toLowerCase().trim(),
          code: hashOtp(otp),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        }
      }).catch(() => {})
      
      sendMail(
        user.email,
        `🔑 ${otp} — Your NUTRA TEIN Login Code`,
        `<p>Your login verification code for mobile number ${cleanPhone} is: <strong>${otp}</strong> (valid for 10 minutes).</p>`
      ).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      message: 'If a delivery channel is available, a verification code has been sent.'
    })
  } catch (error: any) {
    console.error('Phone OTP error')
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
