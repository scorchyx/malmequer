import { sendEmail } from './email'
import {
  renderSimpleWelcomeEmail,
} from './email-templates-new'
import { prisma } from './prisma'

export enum NotificationType {
  WELCOME = 'WELCOME',
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  STOCK_ALERT = 'STOCK_ALERT',
  PROMOTION = 'PROMOTION',
  ACCOUNT_UPDATE = 'ACCOUNT_UPDATE',
}

interface BaseNotification {
  type: NotificationType
  recipientEmail: string
  recipientName: string
  userId?: string
}

interface WelcomeNotification extends BaseNotification {
  type: NotificationType.WELCOME
  verificationUrl?: string
}

interface OrderNotification extends BaseNotification {
  type: NotificationType.ORDER_CONFIRMATION | NotificationType.ORDER_SHIPPED
  orderNumber: string
  orderTotal: string
  orderItems: Array<{
    name: string
    quantity: number
    price: string
  }>
  trackingUrl?: string
}

interface PasswordResetNotification extends BaseNotification {
  type: NotificationType.PASSWORD_RESET
  resetUrl: string
}

interface StockAlertNotification extends BaseNotification {
  type: NotificationType.STOCK_ALERT
  productName: string
  productUrl: string
}

type NotificationData =
  | WelcomeNotification
  | OrderNotification
  | PasswordResetNotification
  | StockAlertNotification

export class NotificationService {
  static async sendNotification(data: NotificationData): Promise<void> {
    try {
      // Check user's notification preferences if userId is provided
      if (data.userId) {
        const settings = await prisma.notificationSettings.findUnique({
          where: { userId: data.userId },
        })

        // If settings exist, check if the specific notification type is enabled
        if (settings) {
          if (!settings.emailNotifications) {
            // Email notifications disabled
            return
          }

          // Check specific notification type preferences
          switch (data.type) {
            case NotificationType.ORDER_CONFIRMATION:
            case NotificationType.ORDER_SHIPPED:
              if (!settings.orderConfirmations && !settings.orderUpdates) {
                // Order notifications disabled
                return
              }
              break
            case NotificationType.STOCK_ALERT:
              if (!settings.stockAlerts) {
                // Stock alerts disabled
                return
              }
              break
            case NotificationType.PROMOTION:
              if (!settings.promotionalEmails) {
                // Promotional emails disabled
                return
              }
              break
            case NotificationType.ACCOUNT_UPDATE:
              if (!settings.accountUpdates) {
                // Account updates disabled
                return
              }
              break
          }
        }
      }

      let subject: string
      let html: string

      switch (data.type) {
        case NotificationType.WELCOME:
          subject = 'Welcome to Malmequer! 🌼'
          html = renderSimpleWelcomeEmail({
            userName: data.recipientName,
            verificationUrl: data.verificationUrl,
          })
          break

        case NotificationType.ORDER_CONFIRMATION:
          subject = `Order confirmation #${data.orderNumber}`
          html = `<h1>Order Confirmed</h1><p>Hello ${data.recipientName}, your order #${data.orderNumber} for ${data.orderTotal} has been confirmed.</p>`
          break

        case NotificationType.ORDER_SHIPPED:
          subject = `Your order #${data.orderNumber} has shipped! 📦`
          html = `<h1>Order Shipped</h1><p>Hello ${data.recipientName}, your order #${data.orderNumber} has been shipped.</p>`
          break

        case NotificationType.PASSWORD_RESET:
          subject = 'Reset your password - Malmequer'
          html = `<h1>Password Reset</h1><p>Hello ${data.recipientName}, click the link to reset your password: <a href="${data.resetUrl}">Reset Password</a></p>`
          break

        case NotificationType.STOCK_ALERT:
          subject = `${data.productName} is back in stock! 🎉`
          html = `<h1>Back in Stock</h1><p>Hello ${data.recipientName}, ${data.productName} is now available!</p>`
          break

        default:
          throw new Error(`Unsupported notification type: ${(data as { type: string }).type}`)
      }

      await sendEmail({
        to: data.recipientEmail,
        subject,
        html,
      })

      // Notification sent successfully
    } catch (error) {
      // Failed to send notification - error logged
      throw error
    }
  }

  // Convenience methods for common notifications
  static async sendWelcomeEmail(
    email: string,
    name: string,
    userId?: string,
    verificationUrl?: string,
  ): Promise<void> {
    await this.sendNotification({
      type: NotificationType.WELCOME,
      recipientEmail: email,
      recipientName: name,
      userId,
      verificationUrl,
    })
  }

  static async sendOrderConfirmation(
    email: string,
    name: string,
    orderNumber: string,
    orderTotal: string,
    orderItems: Array<{ name: string; quantity: number; price: string }>,
    userId?: string,
  ): Promise<void> {
    await this.sendNotification({
      type: NotificationType.ORDER_CONFIRMATION,
      recipientEmail: email,
      recipientName: name,
      userId,
      orderNumber,
      orderTotal,
      orderItems,
    })
  }

  static async sendOrderShipped(
    email: string,
    name: string,
    orderNumber: string,
    orderTotal: string,
    orderItems: Array<{ name: string; quantity: number; price: string }>,
    userId?: string,
    trackingUrl?: string,
  ): Promise<void> {
    await this.sendNotification({
      type: NotificationType.ORDER_SHIPPED,
      recipientEmail: email,
      recipientName: name,
      userId,
      orderNumber,
      orderTotal,
      orderItems,
      trackingUrl,
    })
  }

  static async sendPasswordReset(
    email: string,
    name: string,
    resetUrl: string,
    userId?: string,
  ): Promise<void> {
    await this.sendNotification({
      type: NotificationType.PASSWORD_RESET,
      recipientEmail: email,
      recipientName: name,
      userId,
      resetUrl,
    })
  }

  static async sendStockAlert(
    email: string,
    name: string,
    productName: string,
    productUrl: string,
    userId?: string,
  ): Promise<void> {
    await this.sendNotification({
      type: NotificationType.STOCK_ALERT,
      recipientEmail: email,
      recipientName: name,
      userId,
      productName,
      productUrl,
    })
  }
}