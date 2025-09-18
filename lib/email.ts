import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL ?? 'noreply@yourdomain.com',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    })

    if (error) {
      // Error sending email logged
      throw new Error(`Failed to send email: ${error.message}`)
    }

    return data
  } catch (error) {
    // Email service error logged
    throw error
  }
}

// export * from './email-templates'