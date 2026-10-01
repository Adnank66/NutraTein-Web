import nodemailer from "nodemailer"

/**
 * Reusable email sending utility using nodemailer with Gmail SMTP.
 * Reads SMTP_EMAIL and SMTP_PASSWORD from environment variables.
 *
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param html - Clean HTML email content
 */
export async function sendMail(to: string, subject: string, html: string) {
  const user = process.env.SMTP_EMAIL || process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS

  if (!user || !pass) {
    console.warn("⚠️ [sendMail] SMTP credentials missing (SMTP_EMAIL or SMTP_PASSWORD in .env). Email notification was not sent.")
    return { success: false, error: "Missing SMTP_EMAIL or SMTP_PASSWORD in .env" }
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents Windows TLS root CA handshake errors
    },
  })

  const mailOptions = {
    from: `"NUTRA TEIN Store" <${user}>`,
    to,
    subject,
    html,
  }

  const info = await transporter.sendMail(mailOptions)
  console.log(`✅ [sendMail] Email sent to ${to}. Message ID: ${info.messageId}`)
  return { success: true, messageId: info.messageId }
}
