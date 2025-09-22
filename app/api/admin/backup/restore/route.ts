/**
 * Admin Database Restore API
 *
 * POST /api/admin/backup/restore - Restore database from backup
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { auditLogger, AuditEventType, AuditSeverity } from '@/lib/audit-logger'
import { backupService } from '@/lib/backup-service'

const restoreBackupSchema = z.object({
  filename: z.string(),
  dropExisting: z.boolean().default(false),
  dataOnly: z.boolean().default(false),
  schemaOnly: z.boolean().default(false),
  excludeTables: z.array(z.string()).default([]),
  confirmation: z.literal('RESTORE_DATABASE'),
})

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
    const validatedData = restoreBackupSchema.parse(body)

    // Additional safety check - require explicit confirmation
    if (validatedData.confirmation !== 'RESTORE_DATABASE') {
      return NextResponse.json(
        { error: 'Database restore requires explicit confirmation' },
        { status: 400 },
      )
    }

    // Log restore request (HIGH severity due to potential data loss)
    await auditLogger.logEvent({
      eventType: AuditEventType.BACKUP_RESTORED,
      severity: AuditSeverity.CRITICAL,
      actorId: session.user.id,
      actorEmail: session.user.email,
      details: {
        action: 'DATABASE_RESTORE_REQUESTED',
        filename: validatedData.filename,
        options: {
          dropExisting: validatedData.dropExisting,
          dataOnly: validatedData.dataOnly,
          schemaOnly: validatedData.schemaOnly,
          excludeTables: validatedData.excludeTables,
        },
        warning: 'POTENTIALLY_DESTRUCTIVE_OPERATION',
      },
    })

    // Perform additional checks in production environment
    if (process.env.NODE_ENV === 'production') {
      // In production, you might want additional safeguards:
      // - Require multiple admin confirmations
      // - Create automatic backup before restore
      // - Restrict restore during business hours
      // - etc.

      // Create automatic backup before restore
      const preRestoreBackup = await backupService.createBackup({
        retentionDays: 7, // Keep pre-restore backup for 7 days
      })

      if (!preRestoreBackup.success) {
        await auditLogger.logFailure({
          eventType: AuditEventType.BACKUP_RESTORED,
          severity: AuditSeverity.CRITICAL,
          actorId: session.user.id,
          actorEmail: session.user.email,
          details: {
            action: 'PRE_RESTORE_BACKUP_FAILED',
            error: preRestoreBackup.error,
          },
        }, new Error(preRestoreBackup.error ?? 'Pre-restore backup failed'))

        return NextResponse.json(
          {
            error: 'Failed to create pre-restore backup. Restore aborted for safety.',
            details: preRestoreBackup.error,
          },
          { status: 500 },
        )
      }

      await auditLogger.logEvent({
        eventType: AuditEventType.BACKUP_CREATED,
        severity: AuditSeverity.HIGH,
        actorId: session.user.id,
        actorEmail: session.user.email,
        details: {
          action: 'PRE_RESTORE_BACKUP_CREATED',
          filename: preRestoreBackup.filename,
          size: preRestoreBackup.size,
        },
      })
    }

    // Perform the restore
    const result = await backupService.restoreBackup(validatedData.filename, {
      dropExisting: validatedData.dropExisting,
      dataOnly: validatedData.dataOnly,
      schemaOnly: validatedData.schemaOnly,
      excludeTables: validatedData.excludeTables,
    })

    if (result.success) {
      // Log successful restore
      await auditLogger.logSuccess({
        eventType: AuditEventType.BACKUP_RESTORED,
        severity: AuditSeverity.CRITICAL,
        actorId: session.user.id,
        actorEmail: session.user.email,
        details: {
          action: 'DATABASE_RESTORE_COMPLETED',
          filename: validatedData.filename,
          duration: result.duration,
          timestamp: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Database restored successfully',
        filename: validatedData.filename,
        duration: result.duration,
        restoredAt: new Date().toISOString(),
        warnings: [
          'Database has been restored from backup',
          'All active sessions have been invalidated',
          'Application restart may be required',
        ],
      })
    } else {
      // Log restore failure
      await auditLogger.logFailure({
        eventType: AuditEventType.BACKUP_RESTORED,
        severity: AuditSeverity.CRITICAL,
        actorId: session.user.id,
        actorEmail: session.user.email,
        details: {
          action: 'DATABASE_RESTORE_FAILED',
          filename: validatedData.filename,
          error: result.error,
          duration: result.duration,
        },
      }, new Error(result.error ?? 'Database restore failed'))

      return NextResponse.json(
        {
          success: false,
          error: result.error ?? 'Database restore failed',
          duration: result.duration,
          recommendations: [
            'Check database connectivity',
            'Verify backup file integrity',
            'Review database permissions',
            'Check available disk space',
          ],
        },
        { status: 500 },
      )
    }

  } catch (error) {
    console.error('Error restoring database:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 },
      )
    }

    // Log unexpected restore error
    try {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        await auditLogger.logFailure({
          eventType: AuditEventType.BACKUP_RESTORED,
          severity: AuditSeverity.CRITICAL,
          actorId: session.user.id,
          actorEmail: session.user.email,
          details: {
            action: 'DATABASE_RESTORE_ERROR',
            error: error instanceof Error ? error.message : String(error),
          },
        }, error instanceof Error ? error : new Error(String(error)))
      }
    } catch (auditError) {
      console.error('Failed to log restore error:', auditError)
    }

    return NextResponse.json(
      { error: 'Failed to restore database' },
      { status: 500 },
    )
  }
}