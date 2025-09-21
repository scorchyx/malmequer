/**
 * Admin Audit Logs API
 *
 * GET /api/admin/audit-logs - Query audit logs with filters
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { auditLogger, AuditEventType, AuditSeverity } from '@/lib/audit-logger'

const querySchema = z.object({
  eventType: z.nativeEnum(AuditEventType).optional(),
  actorId: z.string().optional(),
  targetId: z.string().optional(),
  severity: z.nativeEnum(AuditSeverity).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0),
})

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 },
      )
    }

    // Parse and validate query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())

    const validatedQuery = querySchema.parse(queryParams)

    // Convert date strings to Date objects
    const filters = {
      ...validatedQuery,
      startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
      endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
    }

    // Query audit logs
    const logs = await auditLogger.queryAuditLogs(filters)

    // Count total logs for pagination
    // Note: This is a simplified count - in production you might want to implement
    // a more efficient counting mechanism
    const totalCount = logs.length

    return NextResponse.json({
      logs,
      pagination: {
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        total: totalCount,
        hasMore: logs.length === validatedQuery.limit,
      },
      filters: {
        eventType: validatedQuery.eventType,
        actorId: validatedQuery.actorId,
        targetId: validatedQuery.targetId,
        severity: validatedQuery.severity,
        startDate: validatedQuery.startDate,
        endDate: validatedQuery.endDate,
      },
    })

  } catch (error) {
    console.error('Error querying audit logs:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: error.issues,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}