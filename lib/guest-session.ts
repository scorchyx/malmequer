import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

const GUEST_SESSION_COOKIE = 'guest_session_id'
const GUEST_SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

/**
 * Generate a secure guest session ID
 */
export function generateGuestSessionId(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Get or create a guest session ID from cookies
 */
export function getGuestSessionId(request: NextRequest): string {
  const existingSessionId = request.cookies.get(GUEST_SESSION_COOKIE)?.value

  if (existingSessionId) {
    return existingSessionId
  }

  return generateGuestSessionId()
}

/**
 * Set guest session cookie in response
 */
export function setGuestSessionCookie(response: NextResponse, sessionId: string): void {
  response.cookies.set(GUEST_SESSION_COOKIE, sessionId, {
    maxAge: GUEST_SESSION_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  })
}

/**
 * Get guest session from request and ensure it's set in response
 */
export function ensureGuestSession(request: NextRequest, response: NextResponse): string {
  const sessionId = getGuestSessionId(request)

  // If this is a new session, set the cookie
  if (!request.cookies.get(GUEST_SESSION_COOKIE)?.value) {
    setGuestSessionCookie(response, sessionId)
  }

  return sessionId
}

/**
 * Clear guest session cookie (useful when user logs in)
 */
export function clearGuestSession(response: NextResponse): void {
  response.cookies.delete(GUEST_SESSION_COOKIE)
}