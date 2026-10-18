import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { withFastTimeout } from "@/lib/fast-data"
import { verifyOtp } from "@/lib/otp"

// Authentication must fail closed if a deployment has not configured its own
// high-entropy signing secret. A committed fallback would let anyone mint sessions.
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
if (!authSecret) {
  throw new Error("AUTH_SECRET (or NEXTAUTH_SECRET) must be configured")
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
        phone: { label: "Phone", type: "text" },
        phoneOtp: { label: "Phone OTP", type: "text" },
        whatsappOptIn: { label: "WhatsApp Opt-In", type: "text" },
      },
      async authorize(credentials) {
        try {
          const whatsappOptIn = credentials.whatsappOptIn === "true" || credentials.whatsappOptIn === true

          // Option A: Phone OTP Login (Does not require email)
          if (credentials?.phone && credentials?.phoneOtp) {
            const cleanPhone = (credentials.phone as string).replace(/[^0-9]/g, "").slice(-10)
            const otp = (credentials.phoneOtp as string).trim()
            const record = await prisma.phoneOTP.findFirst({
              where: {
                phone: cleanPhone,
              },
              orderBy: { createdAt: "desc" },
            })
            if (!record || new Date() > record.expiresAt || !verifyOtp(record.code, otp)) return null
            await prisma.phoneOTP.delete({ where: { id: record.id } }).catch(() => {})
            let dbUser = await prisma.user.findFirst({
              where: {
                OR: [
                  { phone: { contains: cleanPhone } },
                  { email: `phone_${cleanPhone}@nutratein.com` },
                ],
              },
            })
            if (!dbUser) {
              dbUser = await prisma.user.create({
                data: {
                  email: `phone_${cleanPhone}@nutratein.com`,
                  phone: cleanPhone,
                  name: `Athlete ${cleanPhone.slice(-4)}`,
                  whatsappOptIn,
                  role: "USER",
                },
              })
            } else if (whatsappOptIn && !dbUser.whatsappOptIn) {
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { whatsappOptIn: true },
              }).catch(() => {})
            }
            return {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
              role: dbUser.role || "USER",
            }
          }

          if (!credentials?.email) return null
          const cleanEmail = (credentials.email as string).toLowerCase().trim()

          // Option B: Instant Verification Code (Email OTP Login)
          if (credentials.otp) {
            const cleanOtp = (credentials.otp as string).trim()
            const otpRecord = await prisma.emailOTP.findFirst({
              where: { email: cleanEmail },
              orderBy: { createdAt: "desc" },
            })

            if (!otpRecord || new Date() > new Date(otpRecord.expiresAt) || !verifyOtp(otpRecord.code, cleanOtp)) {
              return null
            }

            // Clean up used OTP
            await prisma.emailOTP.delete({ where: { id: otpRecord.id } }).catch(() => {})

            // Find or automatically create authorized user
            let dbUser = await prisma.user.findUnique({ where: { email: cleanEmail } })
            if (!dbUser) {
              dbUser = await prisma.user.create({
                data: {
                  email: cleanEmail,
                  name: cleanEmail.split("@")[0],
                  emailVerified: new Date(),
                  whatsappOptIn: whatsappOptIn,
                  role: "USER",
                },
              })
            } else {
              // Update verification status and WhatsApp opt-in preference
              await prisma.user.update({
                where: { id: dbUser.id },
                data: {
                  emailVerified: new Date(),
                  whatsappOptIn: whatsappOptIn || dbUser.whatsappOptIn,
                },
              }).catch(() => {})
            }

            // Security alert: Dispatch email notification immediately when Admin logs in via OTP
            if (dbUser.role === "ADMIN" || dbUser.role === "SUPER_ADMIN") {
              const { sendAdminLoginAlertEmail } = await import("@/lib/email-service")
              sendAdminLoginAlertEmail(dbUser.email, dbUser.name || "Administrator").catch((alertErr) =>
                console.warn("Admin login alert notice:", alertErr)
              )
            }

            return {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
              image: dbUser.image,
              role: dbUser.role,
            }
          }

          // Option C: Password Login
          const password = credentials.password as string
          if (!password) return null

          // Check database users with bcrypt. Roles are loaded from the database;
          // they are never granted from an email address or hard-coded account.
          const dbUser = await prisma.user.findUnique({ where: { email: cleanEmail } })

          if (dbUser && dbUser.password) {
            const isValid = await bcrypt.compare(password, dbUser.password)
            if (isValid) {
              if (whatsappOptIn && !dbUser.whatsappOptIn) {
                await prisma.user.update({
                  where: { id: dbUser.id },
                  data: { whatsappOptIn: true },
                }).catch(() => {})
              }

              // Security alert: Dispatch email notification immediately when Admin credentials are used
              if (dbUser.role === "ADMIN" || dbUser.role === "SUPER_ADMIN") {
                const { sendAdminLoginAlertEmail } = await import("@/lib/email-service")
                sendAdminLoginAlertEmail(dbUser.email, dbUser.name || "Administrator").catch((alertErr) =>
                  console.warn("Admin login alert notice:", alertErr)
                )
              }

              return {
                id: dbUser.id,
                email: dbUser.email,
                name: dbUser.name,
                image: dbUser.image,
                role: dbUser.role,
              }
            }
          }

          return null
        } catch (err) {
          console.error("Auth authorize error:", err)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role as string
      }
      return session
    },
  },
})
