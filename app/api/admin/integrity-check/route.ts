/**
 * Admin Data Integrity Check API
 *
 * GET /api/admin/integrity-check - Run system-wide integrity checks
 * POST /api/admin/integrity-check - Run specific integrity checks
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { auditLogger, AuditEventType, AuditSeverity } from '@/lib/audit-logger'
import { integrityValidator } from '@/lib/integrity-validator'

const specificCheckSchema = z.object({
  type: z.enum(['order', 'payment', 'inventory']),
  entityId: z.string(),
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

    // Log the integrity check request
    await auditLogger.logEvent({
      eventType: AuditEventType.CONFIGURATION_CHANGED,
      severity: AuditSeverity.MEDIUM,
      actorId: session.user.id,
      actorEmail: session.user.email,
      details: {
        action: 'SYSTEM_INTEGRITY_CHECK_REQUESTED',
        type: 'FULL_SYSTEM_SCAN',
      },
    })

    // Run comprehensive system integrity check
    const results = await integrityValidator.runSystemIntegrityCheck()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      recommendations: generateRecommendations(results),
    })

  } catch (error) {
    console.error('Error running integrity check:', error)

    return NextResponse.json(
      { error: 'Failed to run integrity check' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 },
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = specificCheckSchema.parse(body)

    // Log the specific integrity check request
    await auditLogger.logEvent({
      eventType: AuditEventType.CONFIGURATION_CHANGED,
      severity: AuditSeverity.LOW,
      actorId: session.user.id,
      actorEmail: session.user.email,
      details: {
        action: 'SPECIFIC_INTEGRITY_CHECK_REQUESTED',
        type: validatedData.type,
        entityId: validatedData.entityId,
      },
    })

    let result

    // Run specific integrity check based on type
    switch (validatedData.type) {
      case 'order':
        result = await integrityValidator.validateOrder(validatedData.entityId)
        break
      case 'payment':
        result = await integrityValidator.validatePayment(validatedData.entityId)
        break
      case 'inventory':
        result = await integrityValidator.validateInventory(validatedData.entityId)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid check type' },
          { status: 400 },
        )
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      checkType: validatedData.type,
      entityId: validatedData.entityId,
      result,
      recommendations: generateSpecificRecommendations(result),
    })

  } catch (error) {
    console.error('Error running specific integrity check:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: 'Failed to run integrity check' },
      { status: 500 },
    )
  }
}

function generateRecommendations(results: any): string[] {
  const recommendations: string[] = []

  if (results.summary.criticalIssues > 0) {
    recommendations.push('🚨 Critical issues detected - immediate attention required')
  }

  if (results.orderIssues.length > 0) {
    recommendations.push('📦 Review order integrity issues - may affect customer experience')
  }

  if (results.inventoryIssues.length > 0) {
    recommendations.push('📊 Review inventory discrepancies - may affect stock accuracy')
  }

  if (results.paymentIssues.length > 0) {
    recommendations.push('💳 Review payment integrity issues - may affect financial records')
  }

  if (results.summary.totalIssues === 0) {
    recommendations.push('✅ System integrity is healthy - no critical issues detected')
  } else {
    recommendations.push('🔧 Schedule regular integrity checks to maintain data quality')
    recommendations.push('📋 Consider implementing automated integrity monitoring')
  }

  return recommendations
}

function generateSpecificRecommendations(result: any): string[] {
  const recommendations: string[] = []

  if (!result.isValid) {
    recommendations.push('🚨 Immediate action required to fix integrity issues')
    recommendations.push('🔍 Investigate root cause of data inconsistency')
  }

  if (result.warnings.length > 0) {
    recommendations.push('⚠️ Monitor warnings for potential future issues')
  }

  if (result.entity === 'Order' && !result.isValid) {
    recommendations.push('📞 Consider contacting customer if order is affected')
    recommendations.push('💰 Verify payment status and refund if necessary')
  }

  if (result.entity === 'Inventory' && !result.isValid) {
    recommendations.push('📦 Update stock levels manually if needed')
    recommendations.push('🔄 Review inventory management processes')
  }

  if (result.entity === 'Payment' && !result.isValid) {
    recommendations.push('💳 Review payment processing logs')
    recommendations.push('🏦 Verify with payment provider (Stripe)')
  }

  return recommendations
}