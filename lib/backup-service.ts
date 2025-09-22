/**
 * Database Backup and Recovery Service
 *
 * Provides automated backup functionality and recovery procedures
 * for PostgreSQL database with security and compliance considerations
 */

import { exec } from 'child_process'
import { unlink, stat } from 'fs/promises'
import { join } from 'path'
import { promisify } from 'util'
import { auditLogger, AuditEventType, AuditSeverity } from './audit-logger'
import { log } from './logger'

const execAsync = promisify(exec)

export interface BackupOptions {
  includeData?: boolean
  includeSchema?: boolean
  excludeTables?: string[]
  compressionLevel?: number
  retentionDays?: number
}

export interface BackupResult {
  success: boolean
  backupId: string
  filename: string
  size: number
  timestamp: Date
  duration: number
  error?: string
}

export interface RestoreOptions {
  dropExisting?: boolean
  dataOnly?: boolean
  schemaOnly?: boolean
  excludeTables?: string[]
}

class BackupService {
  private backupDir: string
  private databaseUrl: string

  constructor() {
    this.backupDir = process.env.BACKUP_DIR ?? './backups'
    this.databaseUrl = process.env.DATABASE_URL ?? ''

    if (!this.databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }
  }

  /**
   * Create a database backup
   */
  async createBackup(options: BackupOptions = {}): Promise<BackupResult> {
    const startTime = Date.now()
    const backupId = this.generateBackupId()
    const filename = `backup_${backupId}.sql${options.compressionLevel ? '.gz' : ''}`
    const filepath = join(this.backupDir, filename)

    const result: BackupResult = {
      success: false,
      backupId,
      filename,
      size: 0,
      timestamp: new Date(),
      duration: 0,
    }

    try {
      // Ensure backup directory exists
      await this.ensureBackupDirectory()

      // Build pg_dump command
      const command = this.buildBackupCommand(filepath, options)

      // Log backup start
      await auditLogger.logEvent({
        eventType: AuditEventType.BACKUP_CREATED,
        severity: AuditSeverity.MEDIUM,
        details: {
          action: 'DATABASE_BACKUP_STARTED',
          backupId,
          filename,
          options,
        },
      })

      log.info('Starting database backup', {
        backupId,
        filename,
        options,
      })

      // Execute backup command
      const { stderr } = await execAsync(command, {
        timeout: 30 * 60 * 1000, // 30 minutes timeout
        env: {
          ...process.env,
          PGPASSWORD: this.extractPasswordFromUrl(),
        },
      })

      if (stderr && !stderr.includes('NOTICE')) {
        throw new Error(`Backup command stderr: ${stderr}`)
      }

      // Get backup file size
      const stats = await stat(filepath)
      result.size = stats.size
      result.success = true
      result.duration = Date.now() - startTime

      // Log successful backup
      await auditLogger.logSuccess({
        eventType: AuditEventType.BACKUP_CREATED,
        severity: AuditSeverity.MEDIUM,
        details: {
          action: 'DATABASE_BACKUP_COMPLETED',
          backupId,
          filename,
          size: result.size,
          duration: result.duration,
          options,
        },
      })

      log.info('Database backup completed successfully', {
        backupId,
        filename,
        size: result.size,
        duration: result.duration,
      })

      // Clean up old backups
      await this.cleanupOldBackups(options.retentionDays ?? 30)

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error)
      result.duration = Date.now() - startTime

      // Log backup failure
      await auditLogger.logFailure({
        eventType: AuditEventType.BACKUP_CREATED,
        severity: AuditSeverity.HIGH,
        details: {
          action: 'DATABASE_BACKUP_FAILED',
          backupId,
          filename,
          options,
          error: result.error,
        },
      }, error instanceof Error ? error : new Error(String(error)))

      log.error('Database backup failed', {
        backupId,
        filename,
        error: result.error,
        duration: result.duration,
      })

      // Clean up failed backup file if it exists
      try {
        await unlink(filepath)
      } catch {
        // Ignore cleanup errors
      }
    }

    return result
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupFilename: string, options: RestoreOptions = {}): Promise<{
    success: boolean
    duration: number
    error?: string
  }> {
    const startTime = Date.now()
    const filepath = join(this.backupDir, backupFilename)

    try {
      // Verify backup file exists
      await stat(filepath)

      // Log restore start
      await auditLogger.logEvent({
        eventType: AuditEventType.BACKUP_RESTORED,
        severity: AuditSeverity.HIGH,
        details: {
          action: 'DATABASE_RESTORE_STARTED',
          filename: backupFilename,
          options,
        },
      })

      log.warn('Starting database restore', {
        filename: backupFilename,
        options,
      })

      // Build restore command
      const command = this.buildRestoreCommand(filepath, options)

      // Execute restore command
      const { stderr } = await execAsync(command, {
        timeout: 60 * 60 * 1000, // 60 minutes timeout
        env: {
          ...process.env,
          PGPASSWORD: this.extractPasswordFromUrl(),
        },
      })

      if (stderr && !stderr.includes('NOTICE')) {
        throw new Error(`Restore command stderr: ${stderr}`)
      }

      const duration = Date.now() - startTime

      // Log successful restore
      await auditLogger.logSuccess({
        eventType: AuditEventType.BACKUP_RESTORED,
        severity: AuditSeverity.HIGH,
        details: {
          action: 'DATABASE_RESTORE_COMPLETED',
          filename: backupFilename,
          duration,
          options,
        },
      })

      log.warn('Database restore completed successfully', {
        filename: backupFilename,
        duration,
      })

      return {
        success: true,
        duration,
      }

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      // Log restore failure
      await auditLogger.logFailure({
        eventType: AuditEventType.BACKUP_RESTORED,
        severity: AuditSeverity.CRITICAL,
        details: {
          action: 'DATABASE_RESTORE_FAILED',
          filename: backupFilename,
          options,
          error: errorMessage,
          duration,
        },
      }, error instanceof Error ? error : new Error(String(error)))

      log.error('Database restore failed', {
        filename: backupFilename,
        error: errorMessage,
        duration,
      })

      return {
        success: false,
        duration,
        error: errorMessage,
      }
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<Array<{
    filename: string
    size: number
    created: Date
    age: string
  }>> {
    try {
      const { readdir } = await import('fs/promises')
      const files = await readdir(this.backupDir)

      const backupFiles = files.filter(file =>
        file.startsWith('backup_') && (file.endsWith('.sql') || file.endsWith('.sql.gz')),
      )

      const backups = await Promise.all(
        backupFiles.map(async (filename) => {
          const filepath = join(this.backupDir, filename)
          const stats = await stat(filepath)
          const ageMs = Date.now() - stats.mtime.getTime()
          const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24))

          return {
            filename,
            size: stats.size,
            created: stats.mtime,
            age: ageDays === 0 ? 'Today' : `${ageDays} day${ageDays > 1 ? 's' : ''} ago`,
          }
        }),
      )

      return backups.sort((a, b) => b.created.getTime() - a.created.getTime())

    } catch (error) {
      log.error('Failed to list backups', {
        error: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  }

  /**
   * Schedule automatic backups
   */
  scheduleAutomaticBackups(options: {
    interval: 'daily' | 'weekly' | 'monthly'
    time?: string // HH:MM format
    retentionDays?: number
  }) {
    // This would typically use a job scheduler like node-cron
    // For now, we'll just log the configuration

    log.info('Automatic backup scheduling configured', {
      interval: options.interval,
      time: options.time ?? '02:00',
      retentionDays: options.retentionDays ?? 30,
    })

    // TODO: Implement actual scheduling with node-cron or similar
    // Example:
    // import cron from 'node-cron'
    // cron.schedule('0 2 * * *', async () => {
    //   await this.createBackup({ retentionDays: options.retentionDays })
    // })
  }

  /**
   * Generate unique backup ID
   */
  private generateBackupId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const random = Math.random().toString(36).substring(2, 8)
    return `${timestamp}_${random}`
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      const { mkdir } = await import('fs/promises')
      await mkdir(this.backupDir, { recursive: true })
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error
      }
    }
  }

  /**
   * Build pg_dump command
   */
  private buildBackupCommand(filepath: string, options: BackupOptions): string {
    const url = new URL(this.databaseUrl)
    const host = url.hostname
    const port = url.port || '5432'
    const database = url.pathname.slice(1)
    const username = url.username

    let command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database}`

    // Add options
    if (options.includeData === false) {
      command += ' --schema-only'
    } else if (options.includeSchema === false) {
      command += ' --data-only'
    }

    if (options.excludeTables && options.excludeTables.length > 0) {
      options.excludeTables.forEach(table => {
        command += ` --exclude-table=${table}`
      })
    }

    // Add compression if requested
    if (options.compressionLevel) {
      command += ` | gzip -${options.compressionLevel} > ${filepath}`
    } else {
      command += ` > ${filepath}`
    }

    return command
  }

  /**
   * Build psql restore command
   */
  private buildRestoreCommand(filepath: string, options: RestoreOptions): string {
    const url = new URL(this.databaseUrl)
    const host = url.hostname
    const port = url.port || '5432'
    const database = url.pathname.slice(1)
    const username = url.username

    let command = ''

    // Handle compressed files
    if (filepath.endsWith('.gz')) {
      command = `gunzip -c ${filepath} | `
    } else {
      command = `cat ${filepath} | `
    }

    command += `psql -h ${host} -p ${port} -U ${username} -d ${database}`

    if (options.dataOnly) {
      command += ' --data-only'
    } else if (options.schemaOnly) {
      command += ' --schema-only'
    }

    return command
  }

  /**
   * Extract password from database URL
   */
  private extractPasswordFromUrl(): string {
    try {
      const url = new URL(this.databaseUrl)
      return url.password || ''
    } catch {
      return ''
    }
  }

  /**
   * Clean up old backup files
   */
  private async cleanupOldBackups(retentionDays: number): Promise<void> {
    try {
      const backups = await this.listBackups()
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

      for (const backup of backups) {
        if (backup.created < cutoffDate) {
          const filepath = join(this.backupDir, backup.filename)
          await unlink(filepath)

          log.info('Deleted old backup file', {
            filename: backup.filename,
            age: backup.age,
          })
        }
      }
    } catch (error) {
      log.error('Failed to clean up old backups', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}

// Singleton instance
export const backupService = new BackupService()