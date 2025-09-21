import { NextRequest, NextResponse } from 'next/server'
import { createVersionedResponse, getApiVersion } from '@/lib/api-versioning'
import { getCurrentUser } from '@/lib/auth'
import { getAllCircuitBreakerStats } from '@/lib/circuit-breaker'
import { logWithContext } from '@/lib/request-context'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 },
      )
    }

    logWithContext('info', 'Admin accessing circuit breaker stats', {
      adminId: user.id,
      type: 'admin_circuit_breaker_access',
    })

    // Get circuit breaker statistics
    const stats = getAllCircuitBreakerStats()

    // Get API version for response formatting
    const version = getApiVersion(request)

    // Transform data based on API version
    const responseData = version === 'v1' ? {
      circuit_breakers: stats,
      timestamp: new Date().toISOString(),
    } : {
      circuitBreakers: stats,
      summary: {
        total: Object.keys(stats).length,
        healthy: Object.values(stats).filter(s => s.state === 'CLOSED').length,
        degraded: Object.values(stats).filter(s => s.state === 'HALF_OPEN').length,
        failed: Object.values(stats).filter(s => s.state === 'OPEN').length,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        monitoringEnabled: true,
      },
    }

    return createVersionedResponse(responseData, version)

  } catch (error) {
    logWithContext('error', 'Error fetching circuit breaker stats', {
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      { error: 'Failed to fetch circuit breaker statistics' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 },
      )
    }

    const { action, service } = await request.json()

    if (!action || !service) {
      return NextResponse.json(
        { error: 'Action and service are required' },
        { status: 400 },
      )
    }

    // This would require importing specific circuit breakers
    // For now, return a placeholder response

    logWithContext('info', 'Admin circuit breaker action', {
      adminId: user.id,
      action,
      service,
      type: 'admin_circuit_breaker_action',
    })

    const version = getApiVersion(request)

    return createVersionedResponse({
      message: `Circuit breaker action '${action}' would be applied to service '${service}'`,
      action,
      service,
      note: 'Circuit breaker control not yet implemented',
    }, version)

  } catch (error) {
    logWithContext('error', 'Error controlling circuit breaker', {
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      { error: 'Failed to control circuit breaker' },
      { status: 500 },
    )
  }
}