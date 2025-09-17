import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Readiness probe endpoint
 *
 * This endpoint checks if the application is ready to serve traffic.
 * It performs essential dependency checks that must pass for the app to function.
 */
export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`

    // Check critical environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ]

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

    if (missingEnvVars.length > 0) {
      return NextResponse.json({
        status: 'not_ready',
        error: `Missing required environment variables: ${missingEnvVars.join(', ')}`
      }, { status: 503 })
    }

    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      status: 'not_ready',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}