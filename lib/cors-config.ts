/**
 * CORS Configuration and API Key Authentication
 * Provides security controls for cross-origin requests and API access
 */

import { NextRequest, NextResponse } from 'next/server'
import { auditLogger, AuditEventType, AuditSeverity } from './audit-logger'
import { log } from './logger'

export interface CorsConfig {
  origin: string[] | string | boolean
  methods: string[]
  allowedHeaders: string[]
  exposedHeaders: string[]
  credentials: boolean
  maxAge: number
  preflightContinue: boolean
}

// CORS configuration for different environments
export const CORS_CONFIGS: Record<string, CorsConfig> = {
  development: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
      'X-API-Version',
      'X-Request-ID',
      'X-Correlation-ID',
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-API-Version',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
  },

  production: {
    origin: [
      'https://yourdomain.com',
      'https://www.yourdomain.com',
      'https://admin.yourdomain.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
      'X-API-Version',
      'X-Request-ID',
      'X-Correlation-ID',
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-API-Version',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset',
    ],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false,
  },
}

/**
 * API Key types and permissions
 */
export enum ApiKeyType {
  PUBLIC = 'PUBLIC',       // Read-only access to public data
  PRIVATE = 'PRIVATE',     // Full access for authenticated operations
  ADMIN = 'ADMIN',         // Administrative operations
  WEBHOOK = 'WEBHOOK',      // Webhook endpoints only
}

export interface ApiKeyPermissions {
  read: boolean
  write: boolean
  admin: boolean
  webhooks: boolean
  rateLimit: number // requests per minute
}

export const API_KEY_PERMISSIONS: Record<ApiKeyType, ApiKeyPermissions> = {
  [ApiKeyType.PUBLIC]: {
    read: true,
    write: false,
    admin: false,
    webhooks: false,
    rateLimit: 100, // 100 requests per minute
  },
  [ApiKeyType.PRIVATE]: {
    read: true,
    write: true,
    admin: false,
    webhooks: false,
    rateLimit: 1000, // 1000 requests per minute
  },
  [ApiKeyType.ADMIN]: {
    read: true,
    write: true,
    admin: true,
    webhooks: true,
    rateLimit: 5000, // 5000 requests per minute
  },
  [ApiKeyType.WEBHOOK]: {
    read: false,
    write: false,
    admin: false,
    webhooks: true,
    rateLimit: 10000, // 10000 requests per minute for webhooks
  },
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string, allowedOrigins: string[] | string | boolean): boolean {
  if (allowedOrigins === true) return true
  if (allowedOrigins === false) return false
  if (typeof allowedOrigins === 'string') return origin === allowedOrigins

  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.some(allowed => {
      if (allowed === '*') return true
      if (allowed.includes('*')) {
        // Simple wildcard matching
        const regex = new RegExp(allowed.replace(/\*/g, '.*'))
        return regex.test(origin)
      }
      return origin === allowed
    })
  }

  return false
}

/**
 * Apply CORS headers to response
 */
export function applyCorsHeaders(
  request: NextRequest,
  response: NextResponse,
  config?: Partial<CorsConfig>,
): NextResponse {
  const env = process.env.NODE_ENV || 'development'
  const corsConfig = { ...CORS_CONFIGS[env], ...config }

  const origin = request.headers.get('origin')
  const requestMethod = request.headers.get('access-control-request-method')
  const requestHeaders = request.headers.get('access-control-request-headers')

  // Handle origin
  if (origin && isOriginAllowed(origin, corsConfig.origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else if (corsConfig.origin === true) {
    response.headers.set('Access-Control-Allow-Origin', '*')
  }

  // Handle credentials
  if (corsConfig.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  // Handle methods
  if (requestMethod || request.method === 'OPTIONS') {
    response.headers.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '))
  }

  // Handle headers
  if (requestHeaders || corsConfig.allowedHeaders.length > 0) {
    response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '))
  }

  // Expose headers
  if (corsConfig.exposedHeaders.length > 0) {
    response.headers.set('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '))
  }

  // Max age for preflight
  if (request.method === 'OPTIONS') {
    response.headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString())
  }

  return response
}

/**
 * Create CORS middleware
 */
export function createCorsMiddleware(config?: Partial<CorsConfig>) {
  return (request: NextRequest): NextResponse | undefined => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 })
      return applyCorsHeaders(request, response, config)
    }

    // For other requests, CORS headers will be applied by the response handler
    return undefined
  }
}

/**
 * Validate API Key (placeholder implementation)
 */
export async function validateApiKey(apiKey: string): Promise<{
  valid: boolean
  keyType?: ApiKeyType
  permissions?: ApiKeyPermissions
  userId?: string
  organizationId?: string
}> {
  // TODO: Implement actual API key validation with database lookup
  // This is a placeholder implementation

  // Validate format (should be a secure random string)
  if (!apiKey || apiKey.length < 32) {
    return { valid: false }
  }

  // Simple pattern matching for demo purposes
  // In production, this would be a database lookup
  if (apiKey.startsWith('pk_')) {
    return {
      valid: true,
      keyType: ApiKeyType.PUBLIC,
      permissions: API_KEY_PERMISSIONS[ApiKeyType.PUBLIC],
    }
  }

  if (apiKey.startsWith('sk_')) {
    return {
      valid: true,
      keyType: ApiKeyType.PRIVATE,
      permissions: API_KEY_PERMISSIONS[ApiKeyType.PRIVATE],
    }
  }

  if (apiKey.startsWith('ak_')) {
    return {
      valid: true,
      keyType: ApiKeyType.ADMIN,
      permissions: API_KEY_PERMISSIONS[ApiKeyType.ADMIN],
    }
  }

  if (apiKey.startsWith('wh_')) {
    return {
      valid: true,
      keyType: ApiKeyType.WEBHOOK,
      permissions: API_KEY_PERMISSIONS[ApiKeyType.WEBHOOK],
    }
  }

  return { valid: false }
}

/**
 * API Key authentication middleware
 */
export function createApiKeyMiddleware() {
  return async (request: NextRequest): Promise<NextResponse | undefined> => {
    // Skip auth for non-API routes
    if (!request.nextUrl.pathname.startsWith('/api/')) {
      return undefined
    }

    // Skip auth for public endpoints
    const publicEndpoints = [
      '/api/health',
      '/api/ready',
      '/api/docs',
      '/api/auth/',
      '/api/register',
      '/api/verify-email',
    ]

    const isPublicEndpoint = publicEndpoints.some(endpoint =>
      request.nextUrl.pathname.startsWith(endpoint),
    )

    if (isPublicEndpoint) {
      return undefined
    }

    // Check for API key
    const apiKey = request.headers.get('x-api-key') ??
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!apiKey) {
      // Check if this is a session-based request (has auth cookie)
      const authCookie = request.cookies.get('next-auth.session-token') ??
                        request.cookies.get('__Secure-next-auth.session-token')

      if (authCookie) {
        // Allow session-based authentication
        return undefined
      }

      await auditLogger.logEvent({
        eventType: AuditEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
        severity: AuditSeverity.MEDIUM,
        details: {
          reason: 'Missing API key',
          endpoint: request.nextUrl.pathname,
          method: request.method,
        },
      })

      return NextResponse.json({
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key is required. Provide it in X-API-Key header or as Bearer token.',
        },
      }, { status: 401 })
    }

    // Validate API key
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      await auditLogger.logEvent({
        eventType: AuditEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
        severity: AuditSeverity.HIGH,
        details: {
          reason: 'Invalid API key',
          endpoint: request.nextUrl.pathname,
          method: request.method,
          apiKeyPrefix: apiKey.substring(0, 8),
        },
      })

      return NextResponse.json({
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key provided.',
        },
      }, { status: 401 })
    }

    // Check permissions for admin endpoints
    if (request.nextUrl.pathname.startsWith('/api/admin/') &&
        validation.keyType !== ApiKeyType.ADMIN) {
      await auditLogger.logEvent({
        eventType: AuditEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
        severity: AuditSeverity.HIGH,
        details: {
          reason: 'Insufficient permissions for admin endpoint',
          endpoint: request.nextUrl.pathname,
          keyType: validation.keyType,
        },
      })

      return NextResponse.json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin API key required for this endpoint.',
        },
      }, { status: 403 })
    }

    // Add API key info to request headers for downstream use
    const headers = new Headers(request.headers)
    headers.set('x-api-key-type', validation.keyType!)
    headers.set('x-api-permissions', JSON.stringify(validation.permissions))

    if (validation.userId) {
      headers.set('x-api-user-id', validation.userId)
    }

    if (validation.organizationId) {
      headers.set('x-api-organization-id', validation.organizationId)
    }

    log.info('API key validated', {
      keyType: validation.keyType,
      endpoint: request.nextUrl.pathname,
      method: request.method,
      type: 'api_key_validation',
    })

    return NextResponse.next({
      request: {
        headers,
      },
    })
  }
}

/**
 * Get API key info from request headers (for use in API routes)
 */
export function getApiKeyInfo(request: NextRequest): {
  keyType?: ApiKeyType
  permissions?: ApiKeyPermissions
  userId?: string
  organizationId?: string
} {
  const keyType = request.headers.get('x-api-key-type') as ApiKeyType
  const permissions = request.headers.get('x-api-permissions')
  const userId = request.headers.get('x-api-user-id')
  const organizationId = request.headers.get('x-api-organization-id')

  return {
    keyType,
    permissions: permissions ? JSON.parse(permissions) : undefined,
    userId: userId ?? undefined,
    organizationId: organizationId ?? undefined,
  }
}