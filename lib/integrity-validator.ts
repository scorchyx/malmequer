/**
 * Data Integrity Validation System
 *
 * Ensures consistency and integrity of critical business data
 * including orders, payments, and inventory
 */

import { auditLogger, AuditEventType, AuditSeverity } from './audit-logger'
import { log } from './logger'
import { prisma } from './prisma'

export interface IntegrityCheckResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  checkedAt: Date
  entity: string
  entityId: string
}

export interface OrderIntegrityData {
  orderId: string
  userId: string | null
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
  total: number
  status: string
  paymentStatus: string
  paymentIntentId?: string
}

export interface PaymentIntegrityData {
  paymentIntentId: string
  orderId: string
  amount: number
  currency: string
  status: string
  stripeStatus?: string
}

class IntegrityValidator {
  /**
   * Validate order data integrity
   */
  async validateOrder(orderId: string): Promise<IntegrityCheckResult> {
    const result: IntegrityCheckResult = {
      isValid: true,
      errors: [],
      warnings: [],
      checkedAt: new Date(),
      entity: 'Order',
      entityId: orderId,
    }

    try {
      // Fetch order with all related data
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, price: true, inventory: true, status: true },
              },
            },
          },
          user: {
            select: { id: true, email: true },
          },
        },
      })

      if (!order) {
        result.isValid = false
        result.errors.push('Order not found')
        return result
      }

      // Check 1: Order items total calculation
      const calculatedTotal = order.items.reduce((sum: number, item) => {
        return sum + (Number(item.price) * item.quantity)
      }, 0)

      const orderTotal = Number(order.totalAmount)
      const totalDifference = Math.abs(calculatedTotal - orderTotal)

      if (totalDifference > 0.01) { // Allow for small rounding differences
        result.isValid = false
        result.errors.push(
          `Order total mismatch: calculated ${calculatedTotal}, stored ${orderTotal}`,
        )
      }

      // Check 2: Order items have valid products
      for (const item of order.items) {
        if (!item.product) {
          result.isValid = false
          result.errors.push(`Order item references non-existent product: ${item.productId}`)
          continue
        }

        // Check if product is still active
        if (item.product.status !== 'ACTIVE') {
          result.warnings.push(`Order contains inactive product: ${item.productId}`)
        }

        // Check if item price matches current product price
        const priceDifference = Math.abs(Number(item.price) - Number(item.product.price))
        if (priceDifference > 0.01) {
          result.warnings.push(
            `Product price has changed since order: ${item.productId} (order: ${item.price}, current: ${item.product.price})`,
          )
        }
      }

      // Check 3: Order status consistency
      const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
      if (!validStatuses.includes(order.status)) {
        result.isValid = false
        result.errors.push(`Invalid order status: ${order.status}`)
      }

      // Check 4: Payment status consistency
      const validPaymentStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED']
      if (!validPaymentStatuses.includes(order.paymentStatus)) {
        result.isValid = false
        result.errors.push(`Invalid payment status: ${order.paymentStatus}`)
      }

      // Check 5: Status logic consistency
      if (order.status === 'DELIVERED' && order.paymentStatus !== 'PAID') {
        result.isValid = false
        result.errors.push('Order marked as delivered but payment is not complete')
      }

      if (order.status === 'CANCELLED' && order.paymentStatus === 'PAID') {
        result.warnings.push('Cancelled order with completed payment - verify refund status')
      }

      // Check 6: User relationship (if order has user)
      if (order.userId && !order.user) {
        result.isValid = false
        result.errors.push(`Order references non-existent user: ${order.userId}`)
      }

      // Check 7: Required fields
      if (!order.items || order.items.length === 0) {
        result.isValid = false
        result.errors.push('Order has no items')
      }

      if (orderTotal <= 0) {
        result.isValid = false
        result.errors.push('Order total must be greater than zero')
      }

    } catch (error) {
      result.isValid = false
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`)

      log.error('Order integrity validation failed', {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    // Log integrity check results
    if (!result.isValid || result.warnings.length > 0) {
      await auditLogger.logEvent({
        eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
        severity: result.isValid ? AuditSeverity.MEDIUM : AuditSeverity.HIGH,
        targetId: orderId,
        targetType: 'Order',
        details: {
          integrityCheck: 'ORDER_VALIDATION',
          isValid: result.isValid,
          errors: result.errors,
          warnings: result.warnings,
        },
      })
    }

    return result
  }

  /**
   * Validate payment data integrity
   */
  async validatePayment(paymentIntentId: string): Promise<IntegrityCheckResult> {
    const result: IntegrityCheckResult = {
      isValid: true,
      errors: [],
      warnings: [],
      checkedAt: new Date(),
      entity: 'Payment',
      entityId: paymentIntentId,
    }

    try {
      // Find order by checking payments table
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentId: paymentIntentId },
        include: {
          order: {
            include: {
              items: true,
            },
          },
        },
      })

      if (!payment || !payment.order) {
        result.isValid = false
        result.errors.push(`No order found for payment intent: ${paymentIntentId}`)
        return result
      }

      const order = payment.order

      // Check 1: Payment amount matches order total
      // Note: This would require Stripe integration to verify actual payment amount
      // For now, we'll check consistency within our database

      // Check 2: Payment status matches order payment status
      if (order.paymentStatus === 'PAID' && order.status === 'PENDING') {
        result.warnings.push('Payment completed but order still pending - may need status update')
      }

      // Check 3: Cancelled orders shouldn't have successful payments
      if (order.status === 'CANCELLED' && order.paymentStatus === 'PAID') {
        result.errors.push('Cancelled order has successful payment - refund may be required')
      }

      // Check 4: Refunded payments should have corresponding order status
      if (order.paymentStatus === 'REFUNDED' && order.status !== 'CANCELLED' && order.status !== 'REFUNDED') {
        result.warnings.push('Payment refunded but order status inconsistent')
      }

    } catch (error) {
      result.isValid = false
      result.errors.push(`Payment validation error: ${error instanceof Error ? error.message : String(error)}`)

      log.error('Payment integrity validation failed', {
        paymentIntentId,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    // Log integrity check results
    if (!result.isValid || result.warnings.length > 0) {
      await auditLogger.logEvent({
        eventType: AuditEventType.PAYMENT_FAILED,
        severity: result.isValid ? AuditSeverity.MEDIUM : AuditSeverity.HIGH,
        targetId: paymentIntentId,
        targetType: 'Payment',
        details: {
          integrityCheck: 'PAYMENT_VALIDATION',
          isValid: result.isValid,
          errors: result.errors,
          warnings: result.warnings,
        },
      })
    }

    return result
  }

  /**
   * Validate inventory consistency
   */
  async validateInventory(productId: string): Promise<IntegrityCheckResult> {
    const result: IntegrityCheckResult = {
      isValid: true,
      errors: [],
      warnings: [],
      checkedAt: new Date(),
      entity: 'Inventory',
      entityId: productId,
    }

    try {
      // Get product current stock
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, inventory: true, name: true },
      })

      if (!product) {
        result.isValid = false
        result.errors.push(`Product not found: ${productId}`)
        return result
      }

      // Calculate stock based on inventory logs
      const inventoryLogs = await prisma.inventoryLog.findMany({
        where: { productId },
        orderBy: { createdAt: 'asc' },
      })

      let calculatedStock = 0
      for (const log of inventoryLogs) {
        switch (log.type) {
          case 'PURCHASE':
          case 'RETURN':
          case 'ADJUSTMENT':
            calculatedStock += log.quantity
            break
          case 'SALE':
            calculatedStock -= log.quantity
            break
        }
      }

      // Check if calculated stock matches stored stock
      if (calculatedStock !== product.inventory) {
        result.isValid = false
        result.errors.push(
          `Stock mismatch for ${product.name}: calculated ${calculatedStock}, stored ${product.inventory}`,
        )
      }

      // Check for negative stock
      if (product.inventory < 0) {
        result.isValid = false
        result.errors.push(`Negative stock detected: ${product.inventory}`)
      }

      // Check for very low stock (warning)
      if (product.inventory > 0 && product.inventory < 5) {
        result.warnings.push(`Low stock warning: ${product.inventory} units remaining`)
      }

    } catch (error) {
      result.isValid = false
      result.errors.push(`Inventory validation error: ${error instanceof Error ? error.message : String(error)}`)

      log.error('Inventory integrity validation failed', {
        productId,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    return result
  }

  /**
   * Run comprehensive integrity checks
   */
  async runSystemIntegrityCheck(): Promise<{
    orderIssues: IntegrityCheckResult[]
    paymentIssues: IntegrityCheckResult[]
    inventoryIssues: IntegrityCheckResult[]
    summary: {
      totalChecked: number
      totalIssues: number
      criticalIssues: number
    }
  }> {
    const results = {
      orderIssues: [] as IntegrityCheckResult[],
      paymentIssues: [] as IntegrityCheckResult[],
      inventoryIssues: [] as IntegrityCheckResult[],
      summary: {
        totalChecked: 0,
        totalIssues: 0,
        criticalIssues: 0,
      },
    }

    try {
      // Check recent orders (last 30 days)
      const recentOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: { id: true },
      })

      for (const order of recentOrders) {
        const orderCheck = await this.validateOrder(order.id)
        if (!orderCheck.isValid || orderCheck.warnings.length > 0) {
          results.orderIssues.push(orderCheck)
        }
        results.summary.totalChecked++
        if (!orderCheck.isValid) {
          results.summary.totalIssues++
          results.summary.criticalIssues++
        }
      }

      // Check all products inventory
      const products = await prisma.product.findMany({
        select: { id: true },
      })

      for (const product of products) {
        const inventoryCheck = await this.validateInventory(product.id)
        if (!inventoryCheck.isValid || inventoryCheck.warnings.length > 0) {
          results.inventoryIssues.push(inventoryCheck)
        }
        results.summary.totalChecked++
        if (!inventoryCheck.isValid) {
          results.summary.totalIssues++
          results.summary.criticalIssues++
        }
      }

      // Log system integrity check summary
      await auditLogger.logEvent({
        eventType: AuditEventType.CONFIGURATION_CHANGED,
        severity: results.summary.criticalIssues > 0 ? AuditSeverity.HIGH : AuditSeverity.LOW,
        details: {
          integrityCheck: 'SYSTEM_WIDE_VALIDATION',
          summary: results.summary,
          timestamp: new Date(),
        },
      })

    } catch (error) {
      log.error('System integrity check failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    }

    return results
  }
}

// Singleton instance
export const integrityValidator = new IntegrityValidator()

/**
 * Convenience functions for common integrity checks
 */
export const IntegrityHelpers = {
  validateNewOrder: async (orderId: string) => {
    const result = await integrityValidator.validateOrder(orderId)
    if (!result.isValid) {
      throw new Error(`Order integrity validation failed: ${result.errors.join(', ')}`)
    }
    return result
  },

  validateBeforePayment: async (orderId: string) => {
    const result = await integrityValidator.validateOrder(orderId)
    if (!result.isValid) {
      throw new Error(`Cannot process payment - order integrity issues: ${result.errors.join(', ')}`)
    }
    return result
  },
}