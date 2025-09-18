import { cache } from './cache'
import { log } from './logger'

export interface AlertConfig {
  name: string
  threshold: number
  duration: number // seconds
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  enabled: boolean
}

export interface AlertCondition {
  metric: string
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  value: number
  timeWindow: number // seconds
}

export interface Alert {
  id: string
  name: string
  condition: AlertCondition
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'triggered' | 'resolved'
  triggeredAt: Date
  resolvedAt?: Date
  description: string
  metadata?: Record<string, unknown>
}

export class AlertManager {
  private static instance: AlertManager
  private alerts: Map<string, Alert> = new Map()
  private configs: Map<string, AlertConfig> = new Map()

  private constructor() {
    this.setupDefaultAlerts()
  }

  public static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager()
    }
    return AlertManager.instance
  }

  private setupDefaultAlerts() {
    const defaultConfigs: AlertConfig[] = [
      {
        name: 'high_memory_usage',
        threshold: 85, // 85% memory usage
        duration: 300, // 5 minutes
        severity: 'high',
        description: 'Memory usage is above 85% for 5 minutes',
        enabled: true,
      },
      {
        name: 'database_response_slow',
        threshold: 1000, // 1 second
        duration: 60, // 1 minute
        severity: 'medium',
        description: 'Database response time above 1 second',
        enabled: true,
      },
      {
        name: 'high_error_rate',
        threshold: 5, // 5% error rate
        duration: 120, // 2 minutes
        severity: 'high',
        description: 'Error rate above 5% for 2 minutes',
        enabled: true,
      },
      {
        name: 'redis_connection_failed',
        threshold: 1, // any failure
        duration: 0, // immediate
        severity: 'medium',
        description: 'Redis connection failure detected',
        enabled: true,
      },
      {
        name: 'critical_service_down',
        threshold: 1, // any downtime
        duration: 0, // immediate
        severity: 'critical',
        description: 'Critical service is down',
        enabled: true,
      },
    ]

    defaultConfigs.forEach(config => {
      this.configs.set(config.name, config)
    })
  }

  async checkMemoryUsage(): Promise<void> {
    const memUsage = process.memoryUsage()
    const percentage = (memUsage.heapUsed / memUsage.heapTotal) * 100

    await this.evaluateCondition('high_memory_usage', {
      metric: 'memory_usage_percentage',
      operator: 'gt',
      value: percentage,
      timeWindow: 300,
    }, {
      currentUsage: percentage,
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    })
  }

  async checkDatabaseResponseTime(responseTime: number): Promise<void> {
    await this.evaluateCondition('database_response_slow', {
      metric: 'database_response_time',
      operator: 'gt',
      value: responseTime,
      timeWindow: 60,
    }, {
      responseTime,
      timestamp: new Date().toISOString(),
    })
  }

  async checkErrorRate(errorCount: number, totalRequests: number): Promise<void> {
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0

    await this.evaluateCondition('high_error_rate', {
      metric: 'error_rate_percentage',
      operator: 'gt',
      value: errorRate,
      timeWindow: 120,
    }, {
      errorRate,
      errorCount,
      totalRequests,
    })
  }

  async checkServiceHealth(serviceName: string, isHealthy: boolean): Promise<void> {
    if (!isHealthy) {
      await this.evaluateCondition('critical_service_down', {
        metric: 'service_health',
        operator: 'eq',
        value: 0, // 0 = down, 1 = up
        timeWindow: 0,
      }, {
        serviceName,
        status: 'down',
        timestamp: new Date().toISOString(),
      })
    }
  }

  private async evaluateCondition(
    alertName: string,
    condition: AlertCondition,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const config = this.configs.get(alertName)
    if (!config?.enabled) {
      return
    }

    const isConditionMet = this.evaluateConditionLogic(condition)
    const existingAlert = this.alerts.get(alertName)

    if (isConditionMet && !existingAlert) {
      // Trigger new alert
      const alert: Alert = {
        id: `${alertName}_${Date.now()}`,
        name: alertName,
        condition,
        severity: config.severity,
        status: 'triggered',
        triggeredAt: new Date(),
        description: config.description,
        metadata,
      }

      this.alerts.set(alertName, alert)
      await this.sendAlert(alert)

    } else if (!isConditionMet && existingAlert && existingAlert.status === 'triggered') {
      // Resolve existing alert
      existingAlert.status = 'resolved'
      existingAlert.resolvedAt = new Date()
      await this.resolveAlert(existingAlert)
      this.alerts.delete(alertName)
    }
  }

  private evaluateConditionLogic(condition: AlertCondition): boolean {
    switch (condition.operator) {
      case 'gt':
        return condition.value > condition.value
      case 'gte':
        return condition.value >= condition.value
      case 'lt':
        return condition.value < condition.value
      case 'lte':
        return condition.value <= condition.value
      case 'eq':
        return condition.value === condition.value
      default:
        return false
    }
  }

  private async sendAlert(alert: Alert): Promise<void> {
    // Log the alert
    log.warn('Alert triggered', {
      alertId: alert.id,
      alertName: alert.name,
      severity: alert.severity,
      description: alert.description,
      metadata: alert.metadata,
      type: 'alert_triggered',
    })

    // Cache alert for monitoring dashboard
    await cache.set(`alert:${alert.id}`, alert, 86400) // 24 hours

    // In a real implementation, you would:
    // - Send email notifications
    // - Send Slack/Discord webhooks
    // - Trigger PagerDuty incidents
    // - Update monitoring dashboards
    // - Send SMS for critical alerts

    // Alert triggered - using logger instead
    // Severity: ${alert.severity.toUpperCase()}
    // Description: ${alert.description}
    // Metadata logged separately
  }

  private async resolveAlert(alert: Alert): Promise<void> {
    log.info('Alert resolved', {
      alertId: alert.id,
      alertName: alert.name,
      severity: alert.severity,
      duration: alert.resolvedAt ? alert.resolvedAt.getTime() - alert.triggeredAt.getTime() : 0,
      type: 'alert_resolved',
    })

    // Update cached alert
    await cache.set(`alert:${alert.id}`, alert, 86400)

    // Alert resolved - using logger instead
    // Duration logged separately
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(alert => alert.status === 'triggered')
  }

  async getAlertHistory(hours: number = 24): Promise<Alert[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return Array.from(this.alerts.values()).filter(
      alert => alert.triggeredAt >= cutoff,
    )
  }

  configureAlert(name: string, config: AlertConfig): void {
    this.configs.set(name, config)
  }

  disableAlert(name: string): void {
    const config = this.configs.get(name)
    if (config) {
      config.enabled = false
    }
  }

  enableAlert(name: string): void {
    const config = this.configs.get(name)
    if (config) {
      config.enabled = true
    }
  }
}

export const alertManager = AlertManager.getInstance()

// Monitoring middleware for automatic checks
export function createMonitoringMiddleware() {
  return async () => {
    try {
      // Check memory usage every 30 seconds
      setInterval(async () => {
        await alertManager.checkMemoryUsage()
      }, 30000)

      // Additional periodic checks can be added here
    } catch (error) {
      log.error('Monitoring middleware error', { error: error instanceof Error ? error.message : String(error) })
    }
  }
}