/**
 * Retry Logic with Exponential Backoff
 * Automatically retries failed operations with increasing delays
 */

import { log } from './logger'

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number        // Initial delay in ms
  maxDelay: number         // Maximum delay in ms
  backoffFactor: number    // Multiplier for exponential backoff
  jitter: boolean          // Add randomness to prevent thundering herd
  retryCondition?: (error: unknown) => boolean
}

export interface RetryStats {
  attempt: number
  totalAttempts: number
  delay: number
  error?: unknown
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,     // 1 second
  maxDelay: 30000,     // 30 seconds
  backoffFactor: 2,
  jitter: true,
}

export class RetryableError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'RetryableError'
  }
}

export class NonRetryableError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'NonRetryableError'
  }
}

/**
 * Executes a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context?: string,
): Promise<T> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }
  let lastError: unknown

  for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
    try {
      const result = await fn()

      if (attempt > 1) {
        log.info('Retry succeeded', {
          context,
          attempt,
          totalAttempts: fullConfig.maxAttempts,
          type: 'retry_success',
        })
      }

      return result
    } catch (error) {
      lastError = error

      // Don't retry on non-retryable errors
      if (error instanceof NonRetryableError) {
        throw error
      }

      // Check custom retry condition
      if (fullConfig.retryCondition && !fullConfig.retryCondition(error)) {
        throw error
      }

      // If this was the last attempt, throw the error
      if (attempt === fullConfig.maxAttempts) {
        log.error('All retry attempts failed', {
          context,
          attempt,
          totalAttempts: fullConfig.maxAttempts,
          error: error instanceof Error ? error.message : String(error),
          type: 'retry_exhausted',
        })
        throw error
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(attempt, fullConfig)

      log.warn('Retry attempt failed, retrying...', {
        context,
        attempt,
        totalAttempts: fullConfig.maxAttempts,
        delay,
        error: error instanceof Error ? error.message : String(error),
        type: 'retry_attempt',
      })

      // Wait before next attempt
      await sleep(delay)
    }
  }

  throw lastError
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1)
  const cappedDelay = Math.min(exponentialDelay, config.maxDelay)

  if (!config.jitter) {
    return cappedDelay
  }

  // Add jitter (±25% randomness)
  const jitterRange = cappedDelay * 0.25
  const jitter = (Math.random() - 0.5) * 2 * jitterRange

  return Math.max(0, cappedDelay + jitter)
}

/**
 * Sleep utility function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Common retry conditions for different types of errors
 */
export const RetryConditions = {
  // Network errors that are typically transient
  networkErrors: (error: unknown): boolean => {
    if (!error || typeof error !== 'object') return false

    const errorCode = 'code' in error ? (error as { code: string }).code : undefined
    const errorMessage = error instanceof Error ? error.message : String(error)

    const networkErrorCodes = [
      'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET',
      'EPIPE', 'EHOSTUNREACH', 'ENETUNREACH',
    ]

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    return (errorCode && networkErrorCodes.includes(errorCode)) ||
           errorMessage.includes('timeout') ||
           errorMessage.includes('connection')
  },

  // HTTP errors that might be transient
  httpErrors: (error: unknown): boolean => {
    if (!error || typeof error !== 'object') return false

    const status = ('status' in error ? (error as { status: number }).status : undefined) ??
                   ('statusCode' in error ? (error as { statusCode: number }).statusCode : undefined)

    // Retry on server errors (5xx) and some client errors
    return status !== undefined && (status >= 500 || status === 429 || status === 408)
  },

  // Database errors that might be transient
  databaseErrors: (error: unknown): boolean => {
    if (!error || typeof error !== 'object') return false

    const errorCode = 'code' in error ? (error as { code: string }).code : undefined
    const errorMessage = error instanceof Error ? error.message : String(error)

    const dbErrorCodes = [
      'CONNECTION_LOST', 'PROTOCOL_CONNECTION_LOST', 'ER_LOCK_WAIT_TIMEOUT',
      'ER_LOCK_DEADLOCK', 'ECONNREFUSED',
    ]

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    return (errorCode && dbErrorCodes.includes(errorCode)) ||
           errorMessage.includes('connection') ||
           errorMessage.includes('timeout') ||
           errorMessage.includes('deadlock')
  },
}

/**
 * Predefined retry configurations for common scenarios
 */
export const RetryConfigs = {
  // Quick retries for fast operations
  fast: {
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 5000,
    backoffFactor: 2,
    jitter: true,
  },

  // Standard retries for most operations
  standard: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    jitter: true,
  },

  // Aggressive retries for critical operations
  aggressive: {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 30000,
    backoffFactor: 2,
    jitter: true,
  },

  // Network-specific retries
  network: {
    maxAttempts: 4,
    baseDelay: 1000,
    maxDelay: 15000,
    backoffFactor: 2,
    jitter: true,
    retryCondition: RetryConditions.networkErrors,
  },

  // Database-specific retries
  database: {
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 5000,
    backoffFactor: 1.5,
    jitter: true,
    retryCondition: RetryConditions.databaseErrors,
  },
}