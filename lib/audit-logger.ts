/**
 * Audit Logging System
 * Tracks all administrative and sensitive operations for compliance and security
 */

import { log } from './logger'
import { prisma } from './prisma'
import { getCurrentRequestId, getRequestContext } from './request-context'

export enum AuditEventType {
  // User management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_REACTIVATED = 'USER_REACTIVATED',

  // Authentication
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',

  // Product management
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  PRODUCT_DELETED = 'PRODUCT_DELETED',
  PRODUCT_PUBLISHED = 'PRODUCT_PUBLISHED',
  PRODUCT_UNPUBLISHED = 'PRODUCT_UNPUBLISHED',

  // Order management
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_FULFILLED = 'ORDER_FULFILLED',
  ORDER_REFUNDED = 'ORDER_REFUNDED',

  // Payment operations
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_ISSUED = 'REFUND_ISSUED',
  REFUND_FAILED = 'REFUND_FAILED',

  // Category management
  CATEGORY_CREATED = 'CATEGORY_CREATED',
  CATEGORY_UPDATED = 'CATEGORY_UPDATED',
  CATEGORY_DELETED = 'CATEGORY_DELETED',

  // Security events
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',

  // System events
  BACKUP_CREATED = 'BACKUP_CREATED',
  BACKUP_RESTORED = 'BACKUP_RESTORED',
  CONFIGURATION_CHANGED = 'CONFIGURATION_CHANGED',
  MAINTENANCE_MODE_ENABLED = 'MAINTENANCE_MODE_ENABLED',
  MAINTENANCE_MODE_DISABLED = 'MAINTENANCE_MODE_DISABLED',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AuditEvent {
  eventType: AuditEventType
  severity: AuditSeverity
  actorId?: string          // User performing the action
  actorEmail?: string       // Email of the user
  actorRole?: string        // Role of the user
  targetId?: string         // ID of the affected resource
  targetType?: string       // Type of the affected resource
  resourceName?: string     // Human-readable name of the resource
  details?: Record<string, unknown>  // Additional context
  ipAddress?: string        // IP address of the actor
  userAgent?: string        // User agent of the actor
  sessionId?: string        // Session ID
  requestId?: string        // Request ID for tracing
  metadata?: Record<string, unknown> // Extra metadata
}

export interface AuditLogEntry extends AuditEvent {
  id: string
  timestamp: Date
  success: boolean
  errorMessage?: string
}

class AuditLogger {
  /**
   * Log an audit event
   */
  async logEvent(event: AuditEvent): Promise<void> {
    try {
      // Enrich event with request context
      const enrichedEvent = this.enrichEventWithContext(event)

      // Log to structured logger for immediate visibility
      log.info('Audit event', {
        ...enrichedEvent,
        type: 'audit_event',
      })

      // Persist to database for long-term storage and compliance
      await this.persistAuditEvent(enrichedEvent)

    } catch (error) {
      // Don't fail the main operation if audit logging fails
      log.error('Failed to log audit event', {
        event,
        error: error instanceof Error ? error.message : String(error),
        type: 'audit_error',
      })
    }
  }

  /**
   * Log a successful operation
   */
  async logSuccess(event: AuditEvent): Promise<void> {
    await this.logEvent({
      ...event,
      details: {
        ...event.details,
        success: true,
      },
    })
  }

  /**
   * Log a failed operation
   */
  async logFailure(event: AuditEvent, error: Error | string): Promise<void> {
    await this.logEvent({
      ...event,
      severity: this.escalateSeverity(event.severity),
      details: {
        ...event.details,
        success: false,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
        } : String(error),
      },
    })
  }

  /**
   * Enrich event with request context
   */
  private enrichEventWithContext(event: AuditEvent): AuditEvent {
    const context = getRequestContext()
    const requestId = getCurrentRequestId()

    return {
      ...event,
      requestId: event.requestId ?? requestId,
      ipAddress: event.ipAddress ?? context?.ip,
      userAgent: event.userAgent ?? context?.userAgent,
      sessionId: event.sessionId ?? context?.sessionId,
    }
  }

  /**
   * Persist audit event to database
   */
  private async persistAuditEvent(event: AuditEvent): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          eventType: event.eventType,
          severity: event.severity,
          actorId: event.actorId,
          actorEmail: event.actorEmail,
          actorRole: event.actorRole,
          targetId: event.targetId,
          targetType: event.targetType,
          resourceName: event.resourceName,
          details: event.details ? JSON.parse(JSON.stringify(event.details)) : null,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          sessionId: event.sessionId,
          requestId: event.requestId,
          metadata: event.metadata ? JSON.parse(JSON.stringify(event.metadata)) : null,
          success: true,
        },
      })
    } catch (error) {
      log.error('Failed to persist audit event to database', {
        event,
        error: error instanceof Error ? error.message : String(error),
        type: 'audit_persistence_error',
      })
      // Don't throw - we don't want audit logging failures to break the main operation
    }
  }

  /**
   * Escalate severity for failed operations
   */
  private escalateSeverity(severity: AuditSeverity): AuditSeverity {
    switch (severity) {
      case AuditSeverity.LOW:
        return AuditSeverity.MEDIUM
      case AuditSeverity.MEDIUM:
        return AuditSeverity.HIGH
      case AuditSeverity.HIGH:
      case AuditSeverity.CRITICAL:
        return AuditSeverity.CRITICAL
      default:
        return AuditSeverity.MEDIUM
    }
  }

  /**
   * Query audit logs
   */
  async queryAuditLogs(filters: {
    eventType?: AuditEventType
    actorId?: string
    targetId?: string
    severity?: AuditSeverity
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }): Promise<AuditLogEntry[]> {
    try {
      const where: Record<string, unknown> = {}

      if (filters.eventType) where.eventType = filters.eventType
      if (filters.actorId) where.actorId = filters.actorId
      if (filters.targetId) where.targetId = filters.targetId
      if (filters.severity) where.severity = filters.severity

      if (filters.startDate || filters.endDate) {
        where.timestamp = {}
        if (filters.startDate) (where.timestamp as Record<string, unknown>).gte = filters.startDate
        if (filters.endDate) (where.timestamp as Record<string, unknown>).lte = filters.endDate
      }

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filters.limit ?? 100,
        skip: filters.offset ?? 0,
      })

      return logs.map(log => ({
        id: log.id,
        eventType: log.eventType as AuditEventType,
        severity: log.severity as AuditSeverity,
        actorId: log.actorId ?? undefined,
        actorEmail: log.actorEmail ?? undefined,
        actorRole: log.actorRole ?? undefined,
        targetId: log.targetId ?? undefined,
        targetType: log.targetType ?? undefined,
        resourceName: log.resourceName ?? undefined,
        details: log.details as Record<string, unknown>,
        ipAddress: log.ipAddress ?? undefined,
        userAgent: log.userAgent ?? undefined,
        sessionId: log.sessionId ?? undefined,
        requestId: log.requestId ?? undefined,
        metadata: log.metadata as Record<string, unknown>,
        timestamp: log.timestamp,
        success: log.success,
        errorMessage: log.errorMessage ?? undefined,
      }))
    } catch (error) {
      log.error('Failed to query audit logs', {
        filters,
        error: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  }
}

// Singleton instance
export const auditLogger = new AuditLogger()

/**
 * Convenience functions for common audit events
 */
export const AuditHelpers = {
  // User operations
  userCreated: (userId: string, userEmail: string, actorId: string) =>
    auditLogger.logSuccess({
      eventType: AuditEventType.USER_CREATED,
      severity: AuditSeverity.MEDIUM,
      actorId,
      targetId: userId,
      targetType: 'User',
      resourceName: userEmail,
      details: { userEmail },
    }),

  userDeleted: (userId: string, userEmail: string, actorId: string) =>
    auditLogger.logSuccess({
      eventType: AuditEventType.USER_DELETED,
      severity: AuditSeverity.HIGH,
      actorId,
      targetId: userId,
      targetType: 'User',
      resourceName: userEmail,
      details: { userEmail },
    }),

  roleChanged: (userId: string, oldRole: string, newRole: string, actorId: string) =>
    auditLogger.logSuccess({
      eventType: AuditEventType.USER_ROLE_CHANGED,
      severity: AuditSeverity.HIGH,
      actorId,
      targetId: userId,
      targetType: 'User',
      details: { oldRole, newRole },
    }),

  // Authentication
  loginSuccess: (userId: string, userEmail: string) =>
    auditLogger.logSuccess({
      eventType: AuditEventType.LOGIN_SUCCESS,
      severity: AuditSeverity.LOW,
      actorId: userId,
      actorEmail: userEmail,
      targetId: userId,
      targetType: 'User',
    }),

  loginFailed: (email: string, reason: string) =>
    auditLogger.logFailure({
      eventType: AuditEventType.LOGIN_FAILED,
      severity: AuditSeverity.MEDIUM,
      actorEmail: email,
      details: { email, reason },
    }, reason),

  // Product operations
  productCreated: (productId: string, productName: string, actorId: string) =>
    auditLogger.logSuccess({
      eventType: AuditEventType.PRODUCT_CREATED,
      severity: AuditSeverity.LOW,
      actorId,
      targetId: productId,
      targetType: 'Product',
      resourceName: productName,
      details: { productName },
    }),

  productDeleted: (productId: string, productName: string, actorId: string) =>
    auditLogger.logSuccess({
      eventType: AuditEventType.PRODUCT_DELETED,
      severity: AuditSeverity.MEDIUM,
      actorId,
      targetId: productId,
      targetType: 'Product',
      resourceName: productName,
      details: { productName },
    }),

  // Security events
  unauthorizedAccess: (resource: string, actorId?: string) =>
    auditLogger.logEvent({
      eventType: AuditEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
      severity: AuditSeverity.HIGH,
      actorId,
      targetType: 'Resource',
      resourceName: resource,
      details: { resource, timestamp: new Date() },
    }),

  suspiciousActivity: (description: string, actorId?: string, details?: Record<string, unknown>) =>
    auditLogger.logEvent({
      eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
      severity: AuditSeverity.HIGH,
      actorId,
      details: { description, ...details },
    }),

  // Payment events
  paymentProcessed: (orderId: string, amount: number, actorId?: string) =>
    auditLogger.logSuccess({
      eventType: AuditEventType.PAYMENT_PROCESSED,
      severity: AuditSeverity.MEDIUM,
      actorId,
      targetId: orderId,
      targetType: 'Order',
      details: { amount, currency: 'EUR' },
    }),

  refundIssued: (orderId: string, amount: number, reason: string, actorId: string) =>
    auditLogger.logSuccess({
      eventType: AuditEventType.REFUND_ISSUED,
      severity: AuditSeverity.HIGH,
      actorId,
      targetId: orderId,
      targetType: 'Order',
      details: { amount, reason, currency: 'EUR' },
    }),
}