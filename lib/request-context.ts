/**
 * Request Context and ID Tracking
 * Provides request tracing across the entire request lifecycle
 */

import { NextRequest, NextResponse } from 'next/server'
import { log } from './logger'

export interface RequestContext {
  id: string
  startTime: number
  method: string
  url: string
  userAgent?: string
  ip?: string
  userId?: string
  sessionId?: string
  correlationId?: string
}

// Store request context using AsyncLocalStorage for Node.js
import { AsyncLocalStorage } from 'async_hooks'
const requestStorage = new AsyncLocalStorage<RequestContext | undefined>()

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 9)
  return `req_${timestamp}_${random}`
}

/**
 * Extract request information for context
 */
export function extractRequestInfo(request: NextRequest): Partial<RequestContext> {
  const url = request.url
  const method = request.method
  const userAgent = request.headers.get('user-agent') || undefined
  const correlationId = request.headers.get('x-correlation-id') || undefined

  // Try to get IP from various headers
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            request.headers.get('cf-connecting-ip') ||
            undefined

  return {
    method,
    url,
    userAgent,
    ip,
    correlationId
  }
}

/**
 * Create and set request context
 */
export function createRequestContext(
  requestId: string,
  requestInfo: Partial<RequestContext>
): RequestContext {
  const context: RequestContext = {
    id: requestId,
    startTime: Date.now(),
    method: requestInfo.method || 'UNKNOWN',
    url: requestInfo.url || 'UNKNOWN',
    userAgent: requestInfo.userAgent,
    ip: requestInfo.ip,
    correlationId: requestInfo.correlationId
  }

  return context
}

/**
 * Get current request context
 */
export function getRequestContext(): RequestContext | undefined {
  return requestStorage.getStore()
}

/**
 * Run function with request context
 */
export function runWithRequestContext<T>(
  context: RequestContext,
  fn: () => T
): T {
  return requestStorage.run(context, fn)
}

/**
 * Update request context with additional information
 */
export function updateRequestContext(updates: Partial<RequestContext>): void {
  const context = getRequestContext()
  if (context) {
    Object.assign(context, updates)
  }
}

/**
 * Middleware factory for request tracking
 */
export function createRequestTrackingMiddleware() {
  return async function requestTrackingMiddleware(
    request: NextRequest
  ): Promise<NextResponse | undefined> {
    // Check if request ID already exists
    const existingRequestId = request.headers.get('x-request-id')
    const requestId = existingRequestId || generateRequestId()

    // Extract request information
    const requestInfo = extractRequestInfo(request)

    // Create context
    const context = createRequestContext(requestId, requestInfo)

    // Log request start
    log.info('Request started', {
      requestId: context.id,
      method: context.method,
      url: context.url,
      userAgent: context.userAgent,
      ip: context.ip,
      correlationId: context.correlationId,
      type: 'request_start'
    })

    // Run the rest of the request in context
    return runWithRequestContext(context, () => {
      // Create response with request ID header
      const response = NextResponse.next()
      response.headers.set('x-request-id', requestId)

      // Add correlation ID if it exists
      if (context.correlationId) {
        response.headers.set('x-correlation-id', context.correlationId)
      }

      return response
    })
  }
}

/**
 * Get request ID from current context or headers
 */
export function getCurrentRequestId(): string | undefined {
  // Try to get from context first
  const context = getRequestContext()
  if (context?.id) {
    return context.id
  }

  // In server components, we can't reliably access headers
  // This should be called from API routes or middleware where context is available
  return undefined
}

/**
 * Log with request context automatically included
 */
export function logWithContext(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  additionalContext?: Record<string, unknown>
): void {
  const context = getRequestContext()
  const logContext = {
    ...additionalContext,
    requestId: context?.id,
    method: context?.method,
    url: context?.url,
    userId: context?.userId,
    sessionId: context?.sessionId,
    correlationId: context?.correlationId
  }

  log[level](message, logContext)
}

/**
 * Performance timing utilities
 */
export function markRequestStart(): void {
  const context = getRequestContext()
  if (context) {
    context.startTime = Date.now()
  }
}

export function getRequestDuration(): number {
  const context = getRequestContext()
  return context ? Date.now() - context.startTime : 0
}

export function logRequestCompletion(statusCode: number): void {
  const context = getRequestContext()
  if (!context) return

  const duration = getRequestDuration()

  logWithContext('info', 'Request completed', {
    statusCode,
    duration,
    type: 'request_complete'
  })
}

/**
 * Error tracking with request context
 */
export function logErrorWithContext(
  error: Error | unknown,
  additionalContext?: Record<string, unknown>
): void {
  const _context = getRequestContext()

  logWithContext('error', 'Request error occurred', {
    ...additionalContext,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : String(error),
    duration: getRequestDuration(),
    type: 'request_error'
  })
}

/**
 * Helper to create a child logger with request context
 */
export function createContextualLogger() {
  const _context = getRequestContext()

  return {
    info: (message: string, extra?: Record<string, unknown>) =>
      logWithContext('info', message, extra),
    warn: (message: string, extra?: Record<string, unknown>) =>
      logWithContext('warn', message, extra),
    error: (message: string, extra?: Record<string, unknown>) =>
      logWithContext('error', message, extra),
    debug: (message: string, extra?: Record<string, unknown>) =>
      logWithContext('debug', message, extra),

    // Specialized logging methods
    apiCall: (service: string, operation: string, duration: number, success: boolean) => {
      logWithContext(success ? 'info' : 'error', `API call to ${service}`, {
        service,
        operation,
        duration,
        success,
        type: 'api_call'
      })
    },

    dbQuery: (table: string, operation: string, duration: number, rowsAffected?: number) => {
      logWithContext('debug', `Database query on ${table}`, {
        table,
        operation,
        duration,
        rowsAffected,
        type: 'db_query'
      })
    }
  }
}