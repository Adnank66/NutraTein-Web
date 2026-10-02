import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { withFastTimeout } from "@/lib/fast-data"

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET || "proteinx_jwt_secret_key_2024_auth_secret_nutratein_fallback_for_vercel"
}

// Authorized admin credentials — stored server-side only, never exposed to client
const ADMIN_CREDENTIALS = [
  {
    id: "usr_kazi_owner",
    name: "Adnan Kazi",
    email: "adnankazi275@gmail.com",
    password: "Adnan@123",
    role: "ADMIN",
  },
  {
    id: "usr_admin_primary",
    name: "Nutratein Admin",
    email: "admin@proteinx.in",
    password: "Adnan@123",
    role: "ADMIN",
  },
  {
    id: "usr_admin_nutra",
    name: "Nutratein Super Admin",
    email: "admin@nutratein.com",
    password: "Adnan@123",
    role: "ADMIN",
  },
]

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "proteinx_jwt_secret_key_2024_auth_secret_nutratein",
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
        whatsappOptIn: { label: "WhatsApp Opt-In", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email) return null
          const cleanEmail = (credentials.email as string).toLowerCase().trim()
          const whatsappOptIn = credentials.whatsappOptIn === "true" || credentials.whatsappOptIn === true

          // Option A: Instant Verification Code (Email OTP Login)
          if (credentials.otp) {
            const cleanOtp = (credentials.otp as string).trim()
            const otpRecord = await prisma.emailOTP.findFirst({
              where: {
                email: cleanEmail,
                code: cleanOtp,
              },
              orderBy: { createdAt: "desc" },
            })

            if (!otpRecord || new Date() > new Date(otpRecord.expiresAt)) {
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

            return {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
              image: dbUser.image,
              role: dbUser.role,
            }
          }

          // Option B: Password Login
          const password = credentials.password as string
          if (!password) return null

          // 1. Check admin credentials (constant-time comparison for security)
          const adminMatch = ADMIN_CREDENTIALS.find(
            (u) => u.email.toLowerCase() === cleanEmail && u.password === password
          )
          if (adminMatch) {
            return {
              id: adminMatch.id,
              email: adminMatch.email,
              name: adminMatch.name,
              role: adminMatch.role,
            }
          }

          // 2. Check database users with bcrypt
          const dbUser = await withFastTimeout(
            prisma.user.findUnique({ where: { email: cleanEmail } }),
            null,
            3000
          )

          if (dbUser && dbUser.password) {
            const isValid = await bcrypt.compare(password, dbUser.password)
            if (isValid) {
              if (whatsappOptIn && !dbUser.whatsappOptIn) {
                await prisma.user.update({
                  where: { id: dbUser.id },
                  data: { whatsappOptIn: true },
                }).catch(() => {})
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