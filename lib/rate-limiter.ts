import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: NextRequest) => string
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export function rateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyGenerator } = config

  return async (req: NextRequest) => {
    const key = keyGenerator ? keyGenerator(req) : getClientIdentifier(req)
    const now = Date.now()

    // Clean expired entries
    if (store[key] && now > store[key].resetTime) {
      delete store[key]
    }

    // Initialize or increment counter
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      }
    } else {
      store[key].count++
    }

    // Check if limit exceeded
    if (store[key].count > maxRequests) {
      const resetTime = Math.ceil((store[key].resetTime - now) / 1000)

      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: resetTime,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': store[key].resetTime.toString(),
            'Retry-After': resetTime.toString(),
          },
        },
      )
    }

    // Add rate limit headers to response
    const remaining = Math.max(0, maxRequests - store[key].count)

    return {
      headers: {
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': store[key].resetTime.toString(),
      },
    }
  }
}

function getClientIdentifier(req: NextRequest): string {
  // Get IP from various headers (for proxy setups)
  const forwarded = req.headers.get('x-forwarded-for')
  const real = req.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] ?? real ?? 'unknown'

  return `ip:${ip}`
}

// Predefined rate limiters for different use cases
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 requests per 15 minutes
})

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 auth attempts per 15 minutes
})

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
})

export const generalRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute
})