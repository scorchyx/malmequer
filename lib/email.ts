import { Resend } from 'resend'

let resendClient: Resend | null = null

function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required')
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const resend = getResendClient()
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