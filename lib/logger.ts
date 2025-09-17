import pino from 'pino'

// Define log levels
export const LOG_LEVELS = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
} as const

// Create logger instance
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'yyyy-mm-dd HH:MM:ss.l',
    }
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV,
    revision: process.env.VERCEL_GIT_COMMIT_SHA,
  },
})

// Structured logging interface
export interface LogContext {
  userId?: string
  requestId?: string
  sessionId?: string
  userAgent?: string
  ip?: string
  method?: string
  url?: string
  statusCode?: number
  duration?: number
  error?: Error | string
  [key: string]: any
}

// Logger service with context
export class Logger {
  private static instance: Logger
  private logger: pino.Logger

  private constructor() {
    this.logger = logger
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private formatMessage(message: string, context?: LogContext): [string, LogContext] {
    const ctx = { ...context }

    // Extract error details if error is provided
    if (ctx.error) {
      if (ctx.error instanceof Error) {
        ctx.errorName = ctx.error.name
        ctx.errorMessage = ctx.error.message
        ctx.errorStack = ctx.error.stack
      } else {
        ctx.errorMessage = String(ctx.error)
      }
      delete ctx.error
    }

    return [message, ctx]
  }

  info(message: string, context?: LogContext): void {
    const [msg, ctx] = this.formatMessage(message, context)
    this.logger.info(ctx, msg)
  }

  warn(message: string, context?: LogContext): void {
    const [msg, ctx] = this.formatMessage(message, context)
    this.logger.warn(ctx, msg)
  }

  error(message: string, context?: LogContext): void {
    const [msg, ctx] = this.formatMessage(message, context)
    this.logger.error(ctx, msg)
  }

  debug(message: string, context?: LogContext): void {
    const [msg, ctx] = this.formatMessage(message, context)
    this.logger.debug(ctx, msg)
  }

  fatal(message: string, context?: LogContext): void {
    const [msg, ctx] = this.formatMessage(message, context)
    this.logger.fatal(ctx, msg)
  }

  // API request logging
  apiRequest(message: string, context: {
    method: string
    url: string
    statusCode: number
    duration: number
    userId?: string
    ip?: string
    userAgent?: string
  }): void {
    this.info(message, {
      ...context,
      type: 'api_request'
    })
  }

  // Security event logging
  securityEvent(message: string, context: {
    event: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    userId?: string
    ip?: string
    userAgent?: string
    details?: any
  }): void {
    this.warn(message, {
      ...context,
      type: 'security_event'
    })
  }

  // Business event logging
  businessEvent(message: string, context: {
    event: string
    userId?: string
    entityType?: string
    entityId?: string
    details?: any
  }): void {
    this.info(message, {
      ...context,
      type: 'business_event'
    })
  }

  // Database operation logging
  dbOperation(message: string, context: {
    operation: string
    table: string
    duration: number
    rowsAffected?: number
    query?: string
  }): void {
    this.debug(message, {
      ...context,
      type: 'db_operation'
    })
  }

  // External service logging
  externalService(message: string, context: {
    service: string
    operation: string
    duration: number
    statusCode?: number
    success: boolean
    error?: Error | string
  }): void {
    if (context.success) {
      this.info(message, {
        ...context,
        type: 'external_service'
      })
    } else {
      this.error(message, {
        ...context,
        type: 'external_service'
      })
    }
  }
}

// Export singleton instance
export const log = Logger.getInstance()

// Middleware for request logging
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now()
    const requestId = Math.random().toString(36).substring(7)

    // Add request ID to headers
    res.setHeader('X-Request-ID', requestId)

    // Log request start
    log.info('Request started', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      type: 'request_start'
    })

    // Override res.end to capture response
    const originalEnd = res.end
    res.end = function(chunk: any, encoding: any) {
      const duration = Date.now() - startTime

      log.apiRequest('Request completed', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      return originalEnd.call(this, chunk, encoding)
    }

    next()
  }
}

// Helper to create child logger with context
export function createContextLogger(context: LogContext) {
  return {
    info: (message: string, additionalContext?: LogContext) =>
      log.info(message, { ...context, ...additionalContext }),
    warn: (message: string, additionalContext?: LogContext) =>
      log.warn(message, { ...context, ...additionalContext }),
    error: (message: string, additionalContext?: LogContext) =>
      log.error(message, { ...context, ...additionalContext }),
    debug: (message: string, additionalContext?: LogContext) =>
      log.debug(message, { ...context, ...additionalContext }),
  }
}