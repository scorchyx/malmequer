import { Resend } from 'resend'
import { circuitBreakers } from './circuit-breaker'
import { withRetry, RetryConfigs, RetryableError } from './retry'
import { createContextualLogger } from './request-context'

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
  const logger = createContextualLogger()
  const startTime = Date.now()

  try {
    const result = await circuitBreakers.email.execute(async () => {
      return await withRetry(async () => {
        const resend = getResendClient()

        logger.info('Sending email', {
          to: Array.isArray(to) ? to.length + ' recipients' : to,
          subject,
          type: 'email_send_start'
        })

        const { data, error } = await resend.emails.send({
          from: process.env.FROM_EMAIL ?? 'noreply@yourdomain.com',
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text,
        })

        if (error) {
          // Determine if error is retryable
          const isRetryable = error.message?.includes('rate limit') ||
                             error.message?.includes('timeout') ||
                             error.message?.includes('connection')

          if (isRetryable) {
            throw new RetryableError(`Resend API error: ${error.message}`, error)
          } else {
            throw new Error(`Failed to send email: ${error.message}`)
          }
        }

        return data
      }, RetryConfigs.network, 'email-send')
    })

    const duration = Date.now() - startTime
    logger.apiCall('resend', 'send-email', duration, true)

    logger.info('Email sent successfully', {
      emailId: result?.id,
      duration,
      type: 'email_send_success'
    })

    return result
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiCall('resend', 'send-email', duration, false)

    logger.error('Failed to send email', {
      error: error instanceof Error ? error.message : String(error),
      duration,
      to: Array.isArray(to) ? to.length + ' recipients' : to,
      subject,
      type: 'email_send_error'
    })

    throw error
  }
}

// export * from './email-templates'