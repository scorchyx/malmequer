import { sendEmail } from './email'
import { prisma } from './prisma'
import {
  renderWelcomeEmail,
  renderOrderConfirmationEmail,
  renderOrderShippedEmail,
  renderPasswordResetEmail,
  renderStockAlertEmail,
} from './email-templates'

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
          where: { userId: data.userId }
        })

        // If settings exist, check if the specific notification type is enabled
        if (settings) {
          if (!settings.emailNotifications) {
            console.log(`Email notifications disabled for user ${data.userId}`)
            return
          }

          // Check specific notification type preferences
          switch (data.type) {
            case NotificationType.ORDER_CONFIRMATION:
            case NotificationType.ORDER_SHIPPED:
              if (!settings.orderConfirmations && !settings.orderUpdates) {
                console.log(`Order notifications disabled for user ${data.userId}`)
                return
              }
              break
            case NotificationType.STOCK_ALERT:
              if (!settings.stockAlerts) {
                console.log(`Stock alerts disabled for user ${data.userId}`)
                return
              }
              break
            case NotificationType.PROMOTION:
              if (!settings.promotionalEmails) {
                console.log(`Promotional emails disabled for user ${data.userId}`)
                return
              }
              break
            case NotificationType.ACCOUNT_UPDATE:
              if (!settings.accountUpdates) {
                console.log(`Account updates disabled for user ${data.userId}`)
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
          subject = 'Bem-vindo ao Malmequer! 🌼'
          html = renderWelcomeEmail({
            userName: data.recipientName,
            verificationUrl: data.verificationUrl,
          })
          break

        case NotificationType.ORDER_CONFIRMATION:
          subject = `Confirmação da tua encomenda #${data.orderNumber}`
          html = renderOrderConfirmationEmail({
            userName: data.recipientName,
            orderNumber: data.orderNumber,
            orderTotal: data.orderTotal,
            orderItems: data.orderItems,
          })
          break

        case NotificationType.ORDER_SHIPPED:
          subject = `A tua encomenda #${data.orderNumber} foi enviada! 📦`
          html = renderOrderShippedEmail({
            userName: data.recipientName,
            orderNumber: data.orderNumber,
            orderTotal: data.orderTotal,
            orderItems: data.orderItems,
            trackingUrl: data.trackingUrl,
          })
          break

        case NotificationType.PASSWORD_RESET:
          subject = 'Redefinir a tua palavra-passe - Malmequer'
          html = renderPasswordResetEmail({
            userName: data.recipientName,
            resetUrl: data.resetUrl,
          })
          break

        case NotificationType.STOCK_ALERT:
          subject = `${data.productName} está novamente disponível! 🎉`
          html = renderStockAlertEmail({
            userName: data.recipientName,
            productName: data.productName,
            productUrl: data.productUrl,
          })
          break

        default:
          throw new Error(`Unsupported notification type: ${(data as any).type}`)
      }

      await sendEmail({
        to: data.recipientEmail,
        subject,
        html,
      })

      console.log(`Notification sent successfully: ${data.type} to ${data.recipientEmail}`)
    } catch (error) {
      console.error('Failed to send notification:', error)
      throw error
    }
  }

  // Convenience methods for common notifications
  static async sendWelcomeEmail(
    email: string,
    name: string,
    userId?: string,
    verificationUrl?: string
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
    userId?: string
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
    trackingUrl?: string
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
    userId?: string
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
    userId?: string
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