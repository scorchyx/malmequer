/**
 * Admin Database Backup API
 *
 * GET /api/admin/backup - List available backups
 * POST /api/admin/backup - Create new backup
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { auditLogger, AuditEventType, AuditSeverity } from '@/lib/audit-logger'
import { backupService } from '@/lib/backup-service'

const createBackupSchema = z.object({
  includeData: z.boolean().default(true),
  includeSchema: z.boolean().default(true),
  excludeTables: z.array(z.string()).default([]),
  compressionLevel: z.number().min(1).max(9).optional(),
  retentionDays: z.number().min(1).max(365).default(30),
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

    // Log backup list request
    await auditLogger.logEvent({
      eventType: AuditEventType.CONFIGURATION_CHANGED,
      severity: AuditSeverity.LOW,
      actorId: session.user.id,
      actorEmail: session.user.email,
      details: {
        action: 'BACKUP_LIST_REQUESTED',
      },
    })

    // Get list of available backups
    const backups = await backupService.listBackups()

    return NextResponse.json({
      success: true,
      backups,
      totalCount: backups.length,
      totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
    })

  } catch (error) {
    console.error('Error listing backups:', error)

    return NextResponse.json(
      { error: 'Failed to list backups' },
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
    const validatedData = createBackupSchema.parse(body)

    // Log backup creation request
    await auditLogger.logEvent({
      eventType: AuditEventType.BACKUP_CREATED,
      severity: AuditSeverity.MEDIUM,
      actorId: session.user.id,
      actorEmail: session.user.email,
      details: {
        action: 'BACKUP_CREATION_REQUESTED',
        options: validatedData,
      },
    })

    // Create backup
    const result = await backupService.createBackup(validatedData)

    if (result.success) {
      return NextResponse.json({
        success: true,
        backup: {
          id: result.backupId,
          filename: result.filename,
          size: result.size,
          timestamp: result.timestamp,
          duration: result.duration,
        },
        message: 'Backup created successfully',
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Backup creation failed',
          duration: result.duration,
        },
        { status: 500 },
      )
    }

  } catch (error) {
    console.error('Error creating backup:', error)

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
      { error: 'Failed to create backup' },
      { status: 500 },
    )
  }
}