/**
 * API Versioning System
 * Provides backward compatibility and controlled API evolution
 */

import { NextRequest, NextResponse } from 'next/server'
import { log } from './logger'
import { getCurrentRequestId } from './request-context'

export type ApiVersion = 'v1' | 'v2'

export const SUPPORTED_VERSIONS: ApiVersion[] = ['v1', 'v2']
export const DEFAULT_VERSION: ApiVersion = 'v1'
export const LATEST_VERSION: ApiVersion = 'v2'

export interface VersionedResponse<T = any> {
  data: T
  meta: {
    version: ApiVersion
    requestId?: string
    timestamp: string
    deprecationWarning?: string
  }
}

export interface ApiVersionConfig {
  version: ApiVersion
  deprecated?: boolean
  deprecationDate?: string
  sunsetDate?: string
  migrationGuide?: string
}

// Version configurations
export const VERSION_CONFIGS: Record<ApiVersion, ApiVersionConfig> = {
  v1: {
    version: 'v1',
    deprecated: false,
    // Will be deprecated when v2 is stable
  },
  v2: {
    version: 'v2',
    deprecated: false,
  }
}

/**
 * Extract API version from request
 */
export function extractApiVersion(request: NextRequest): ApiVersion {
  // 1. Check URL path first (/api/v1/...)
  const urlMatch = request.nextUrl.pathname.match(/^\/api\/(v\d+)\//)
  if (urlMatch && isSupportedVersion(urlMatch[1] as ApiVersion)) {
    return urlMatch[1] as ApiVersion
  }

  // 2. Check Accept header (application/vnd.api+json; version=1)
  const acceptHeader = request.headers.get('accept')
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/version=(\d+)/)
    if (versionMatch) {
      const version = `v${versionMatch[1]}` as ApiVersion
      if (isSupportedVersion(version)) {
        return version
      }
    }
  }

  // 3. Check custom header
  const versionHeader = request.headers.get('x-api-version')
  if (versionHeader && isSupportedVersion(versionHeader as ApiVersion)) {
    return versionHeader as ApiVersion
  }

  // 4. Default version
  return DEFAULT_VERSION
}

/**
 * Check if version is supported
 */
export function isSupportedVersion(version: string): version is ApiVersion {
  return SUPPORTED_VERSIONS.includes(version as ApiVersion)
}

/**
 * Create versioned response
 */
export function createVersionedResponse<T>(
  data: T,
  version: ApiVersion,
  status: number = 200
): NextResponse {
  const config = VERSION_CONFIGS[version]
  const requestId = getCurrentRequestId()

  const response: VersionedResponse<T> = {
    data,
    meta: {
      version,
      requestId,
      timestamp: new Date().toISOString()
    }
  }

  // Add deprecation warning if needed
  if (config.deprecated) {
    response.meta.deprecationWarning = createDeprecationWarning(config)
  }

  const nextResponse = NextResponse.json(response, { status })

  // Add version headers
  nextResponse.headers.set('x-api-version', version)
  nextResponse.headers.set('x-api-supported-versions', SUPPORTED_VERSIONS.join(', '))

  // Add deprecation headers if needed
  if (config.deprecated) {
    nextResponse.headers.set('x-api-deprecated', 'true')
    if (config.deprecationDate) {
      nextResponse.headers.set('x-api-deprecation-date', config.deprecationDate)
    }
    if (config.sunsetDate) {
      nextResponse.headers.set('x-api-sunset-date', config.sunsetDate)
    }
  }

  return nextResponse
}

/**
 * Create deprecation warning message
 */
function createDeprecationWarning(config: ApiVersionConfig): string {
  let warning = `API version ${config.version} is deprecated.`

  if (config.deprecationDate) {
    warning += ` Deprecated on ${config.deprecationDate}.`
  }

  if (config.sunsetDate) {
    warning += ` Will be removed on ${config.sunsetDate}.`
  }

  warning += ` Please migrate to version ${LATEST_VERSION}.`

  if (config.migrationGuide) {
    warning += ` Migration guide: ${config.migrationGuide}`
  }

  return warning
}

/**
 * Version-specific data transformers
 */
export const DataTransformers = {
  // Transform user data based on version
  transformUser: (user: any, version: ApiVersion) => {
    switch (version) {
      case 'v1':
        // V1 format - legacy structure
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.createdAt, // snake_case for v1
          updated_at: user.updatedAt
        }

      case 'v2':
        // V2 format - improved structure
        return {
          id: user.id,
          profile: {
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified
          },
          authorization: {
            role: user.role,
            permissions: user.permissions || []
          },
          timestamps: {
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt
          }
        }

      default:
        return user
    }
  },

  // Transform product data based on version
  transformProduct: (product: any, version: ApiVersion) => {
    switch (version) {
      case 'v1':
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          compare_price: product.comparePrice,
          sku: product.sku,
          inventory: product.inventory,
          category_id: product.categoryId,
          images: product.images,
          created_at: product.createdAt,
          updated_at: product.updatedAt
        }

      case 'v2':
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          pricing: {
            price: product.price,
            comparePrice: product.comparePrice,
            currency: 'EUR'
          },
          inventory: {
            sku: product.sku,
            stock: product.inventory,
            trackInventory: true
          },
          category: {
            id: product.categoryId,
            name: product.category?.name
          },
          media: {
            images: product.images || [],
            primaryImage: product.images?.[0]
          },
          metadata: {
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            status: product.status || 'ACTIVE'
          }
        }

      default:
        return product
    }
  },

  // Transform order data based on version
  transformOrder: (order: any, version: ApiVersion) => {
    switch (version) {
      case 'v1':
        return {
          id: order.id,
          order_number: order.orderNumber,
          status: order.status,
          total_amount: order.totalAmount,
          user_id: order.userId,
          items: order.items,
          created_at: order.createdAt,
          updated_at: order.updatedAt
        }

      case 'v2':
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: {
            current: order.status,
            history: order.statusHistory || []
          },
          pricing: {
            subtotal: order.subtotalAmount,
            taxes: order.taxAmount,
            shipping: order.shippingAmount,
            total: order.totalAmount,
            currency: 'EUR'
          },
          customer: {
            id: order.userId,
            name: order.user?.name,
            email: order.user?.email
          },
          items: order.items?.map((item: any) => ({
            id: item.id,
            product: {
              id: item.productId,
              name: item.product?.name,
              sku: item.product?.sku
            },
            quantity: item.quantity,
            pricing: {
              unitPrice: item.price,
              totalPrice: item.price * item.quantity
            }
          })),
          timestamps: {
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            completedAt: order.completedAt
          }
        }

      default:
        return order
    }
  }
}

/**
 * Middleware for API versioning
 */
export function createVersioningMiddleware() {
  return (request: NextRequest) => {
    const version = extractApiVersion(request)
    const config = VERSION_CONFIGS[version]

    // Log version usage for analytics
    log.info('API version used', {
      version,
      path: request.nextUrl.pathname,
      method: request.method,
      deprecated: config.deprecated,
      userAgent: request.headers.get('user-agent') ?? undefined,
      type: 'api_version_usage'
    })

    // Add version to request headers for downstream handlers
    const headers = new Headers(request.headers)
    headers.set('x-detected-api-version', version)

    return NextResponse.next({
      request: {
        headers
      }
    })
  }
}

/**
 * Helper to get version from request in API routes
 */
export function getApiVersion(request: NextRequest): ApiVersion {
  // First check if middleware already detected it
  const detectedVersion = request.headers.get('x-detected-api-version')
  if (detectedVersion && isSupportedVersion(detectedVersion as ApiVersion)) {
    return detectedVersion as ApiVersion
  }

  // Fallback to extraction
  return extractApiVersion(request)
}

/**
 * Validate if version supports a specific feature
 */
export function supportsFeature(version: ApiVersion, feature: string): boolean {
  const featureMatrix: Record<ApiVersion, string[]> = {
    v1: [
      'basic-crud',
      'authentication',
      'pagination',
      'filtering'
    ],
    v2: [
      'basic-crud',
      'authentication',
      'pagination',
      'filtering',
      'advanced-search',
      'batch-operations',
      'webhooks',
      'rate-limiting-headers',
      'etag-support'
    ]
  }

  return featureMatrix[version]?.includes(feature) || false
}

/**
 * Create error response for unsupported version
 */
export function createUnsupportedVersionResponse(requestedVersion: string): NextResponse {
  return NextResponse.json({
    error: {
      code: 'UNSUPPORTED_API_VERSION',
      message: `API version '${requestedVersion}' is not supported.`,
      supportedVersions: SUPPORTED_VERSIONS,
      latestVersion: LATEST_VERSION
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: getCurrentRequestId()
    }
  }, { status: 400 })
}