import { NextResponse } from 'next/server'
import { cache } from '@/lib/cache'
import { log } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: {
    database: {
      status: 'healthy' | 'unhealthy'
      responseTime?: number
      error?: string
    }
    redis: {
      status: 'healthy' | 'unhealthy'
      responseTime?: number
      error?: string
    }
    memory: {
      status: 'healthy' | 'unhealthy'
      usage: {
        used: number
        total: number
        percentage: number
      }
    }
  }
}

export async function GET() {
  const startTime = Date.now()

  try {
    const checks = await performHealthChecks()
    const overallStatus = determineOverallStatus(checks)

    const healthResult: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? '1.0.0',
      environment: process.env.NODE_ENV ?? 'development',
      checks,
    }

    // Log health check
    log.info('Health check performed', {
      status: overallStatus,
      duration: Date.now() - startTime,
      type: 'health_check',
    })

    const statusCode = overallStatus === 'healthy' ? 200 :
      overallStatus === 'degraded' ? 200 : 503

    return NextResponse.json(healthResult, { status: statusCode })

  } catch (error) {
    log.error('Health check failed', { error: error instanceof Error ? error.message : String(error) })

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    }, { status: 503 })
  }
}

async function performHealthChecks() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    memory: checkMemory(),
  }

  return checks
}

async function checkDatabase() {
  const startTime = Date.now()

  try {
    // Simple database connectivity check
    await prisma.$queryRaw`SELECT 1`

    return {
      status: 'healthy' as const,
      responseTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      status: 'unhealthy' as const,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Database connection failed',
    }
  }
}

async function checkRedis() {
  const startTime = Date.now()

  try {
    // Test Redis connectivity with a simple ping
    const testKey = 'health_check_test'
    const testValue = Date.now().toString()

    await cache.set(testKey, testValue, 10) // 10 second TTL
    const result = await cache.get(testKey)

    if (result !== testValue) {
      throw new Error('Redis read/write test failed')
    }

    await cache.del(testKey) // Clean up

    return {
      status: 'healthy' as const,
      responseTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      status: 'unhealthy' as const,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Redis connection failed',
    }
  }
}

function checkMemory() {
  const memUsage = process.memoryUsage()
  const totalMem = memUsage.heapTotal
  const usedMem = memUsage.heapUsed
  const percentage = (usedMem / totalMem) * 100

  // Consider memory unhealthy if usage is above 90%
  const status: 'healthy' | 'unhealthy' = percentage > 90 ? 'unhealthy' : 'healthy'

  return {
    status,
    usage: {
      used: Math.round(usedMem / 1024 / 1024), // MB
      total: Math.round(totalMem / 1024 / 1024), // MB
      percentage: Math.round(percentage * 100) / 100,
    },
  }
}

function determineOverallStatus(checks: any): 'healthy' | 'unhealthy' | 'degraded' {
  const statuses = Object.values(checks).map((check: any) => check.status)

  if (statuses.every(status => status === 'healthy')) {
    return 'healthy'
  }

  if (statuses.some(status => status === 'unhealthy')) {
    // If database is unhealthy, overall is unhealthy
    if (checks.database.status === 'unhealthy') {
      return 'unhealthy'
    }
    // If only Redis or memory is unhealthy, it's degraded
    return 'degraded'
  }

  return 'healthy'
}