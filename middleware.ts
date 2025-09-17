import { NextRequest, NextResponse } from 'next/server'
import { addSecurityHeaders } from '@/lib/security-headers'
import { generalRateLimit, authRateLimit } from '@/lib/rate-limiter'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Apply rate limiting based on path
  let rateLimitResult

  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/register')) {
    rateLimitResult = await authRateLimit(request)
  } else if (pathname.startsWith('/api/')) {
    rateLimitResult = await generalRateLimit(request)
  }

  // If rate limit exceeded, return early
  if (rateLimitResult instanceof NextResponse) {
    return addSecurityHeaders(rateLimitResult)
  }

  // Continue with the request
  const response = NextResponse.next()

  // Add rate limit headers if available
  if (rateLimitResult?.headers) {
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }

  // Add security headers to all responses
  return addSecurityHeaders(response)
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}