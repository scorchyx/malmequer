import Stripe from 'stripe'
import { circuitBreakers } from './circuit-breaker'
import { createContextualLogger } from './request-context'
import { withRetry, RetryConfigs, RetryableError } from './retry'

let stripeClient: Stripe | null = null

function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required')
    }
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    })
  }
  return stripeClient
}

// Enhanced Stripe client with reliability patterns
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripeClient()
    const value = client[prop as keyof Stripe]

    if (typeof value === 'function') {
      return async function(...args: unknown[]) {
        const logger = createContextualLogger()
        const startTime = Date.now()

        return circuitBreakers.stripe.execute(async () => {
          return await withRetry(async () => {
            logger.info('Stripe API call', {
              method: prop.toString(),
              type: 'stripe_api_call_start',
            })

            try {
              const result = await (value as Function).call(client, ...args)

              const duration = Date.now() - startTime
              logger.apiCall('stripe', prop.toString(), duration, true)

              return result
            } catch (error: unknown) {
              // Determine if error is retryable
              const errorType = error && typeof error === 'object' && 'type' in error ? (error as { type: string }).type : undefined
              const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : undefined
              const errorMessage = error instanceof Error ? error.message : String(error)

              const isConnectionError = errorType === 'StripeConnectionError'
              const isRateLimitError = errorType === 'StripeAPIError' && errorCode === 'rate_limit'
              const hasTimeoutMessage = errorMessage.includes('timeout')
              const hasConnectionMessage = errorMessage.includes('connection')

              const isRetryable = [isConnectionError, isRateLimitError, hasTimeoutMessage, hasConnectionMessage].some(Boolean)

              if (isRetryable) {
                throw new RetryableError(`Stripe API error: ${errorMessage}`, error)
              } else {
                throw error
              }
            }
          }, RetryConfigs.network, `stripe-${prop.toString()}`)
        }).catch((error) => {
          const duration = Date.now() - startTime
          logger.apiCall('stripe', prop.toString(), duration, false)

          logger.error('Stripe API call failed', {
            method: prop.toString(),
            error: error instanceof Error ? error.message : String(error),
            duration,
            type: 'stripe_api_call_error',
          })

          throw error
        })
      }
    }

    return value
  },
})

export const CURRENCY = 'eur'
export const MIN_AMOUNT = 0.5
export const MAX_AMOUNT = 999999