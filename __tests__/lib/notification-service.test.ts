import { sendEmail } from '@/lib/email'
import { NotificationService, NotificationType } from '@/lib/notification-service'

// Mock dependencies
jest.mock('@/lib/email')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    notificationSettings: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/email-templates-new', () => ({
  renderSimpleWelcomeEmail: jest.fn(() => '<h1>Welcome!</h1>'),
}))

const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>

// Mock prisma directly
const mockPrismaNotificationSettings = {
  findUnique: jest.fn(),
}

// Override the mock after it's set up
beforeEach(() => {
  jest.clearAllMocks()
  const { prisma } = require('@/lib/prisma')
  Object.assign(prisma.notificationSettings, mockPrismaNotificationSettings)
})

describe('NotificationService', () => {
  describe('sendNotification', () => {
    it('should send welcome email successfully', async () => {
      mockSendEmail.mockResolvedValue({ id: 'test' } as any)

      await NotificationService.sendNotification({
        type: NotificationType.WELCOME,
        recipientEmail: 'test@example.com',
        recipientName: 'Test User',
        userId: 'user1',
      })

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Welcome to Malmequer! 🌼',
        html: '<h1>Welcome!</h1>',
      })
    })

    it('should send order confirmation email', async () => {
      mockSendEmail.mockResolvedValue({ id: 'test' } as any)

      await NotificationService.sendNotification({
        type: NotificationType.ORDER_CONFIRMATION,
        recipientEmail: 'customer@example.com',
        recipientName: 'Customer',
        userId: 'user1',
        orderNumber: 'ORD-123',
        orderTotal: '€49.99',
        orderItems: [
          { name: 'Product 1', quantity: 2, price: '€24.99' },
        ],
      })

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'customer@example.com',
        subject: 'Order confirmation #ORD-123',
        html: expect.stringContaining('Order Confirmed'),
      })
    })

    it('should send refund notification email', async () => {
      mockSendEmail.mockResolvedValue({ id: 'test' } as any)

      await NotificationService.sendNotification({
        type: NotificationType.ORDER_REFUNDED,
        recipientEmail: 'customer@example.com',
        recipientName: 'Customer',
        userId: 'user1',
        orderNumber: 'ORD-123',
        refundAmount: '€25.00',
        reason: 'Defective product',
      })

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'customer@example.com',
        subject: 'Refund processed for order #ORD-123',
        html: expect.stringContaining('Refund Processed'),
      })
    })

    it('should respect user notification preferences', async () => {
      const settings = {
        emailNotifications: false,
        orderConfirmations: true,
        orderUpdates: true,
      }

      mockPrismaNotificationSettings.findUnique.mockResolvedValue(settings)

      await NotificationService.sendNotification({
        type: NotificationType.ORDER_CONFIRMATION,
        recipientEmail: 'customer@example.com',
        recipientName: 'Customer',
        userId: 'user1',
        orderNumber: 'ORD-123',
        orderTotal: '€49.99',
        orderItems: [],
      })

      // Should not send email when emailNotifications is disabled
      expect(mockSendEmail).not.toHaveBeenCalled()
    })

    it('should skip order notifications when disabled in preferences', async () => {
      const settings = {
        emailNotifications: true,
        orderConfirmations: false,
        orderUpdates: false,
      }

      mockPrismaNotificationSettings.findUnique.mockResolvedValue(settings)

      await NotificationService.sendNotification({
        type: NotificationType.ORDER_CONFIRMATION,
        recipientEmail: 'customer@example.com',
        recipientName: 'Customer',
        userId: 'user1',
        orderNumber: 'ORD-123',
        orderTotal: '€49.99',
        orderItems: [],
      })

      expect(mockSendEmail).not.toHaveBeenCalled()
    })

    it('should skip promotional emails when disabled', async () => {
      const settings = {
        emailNotifications: true,
        promotionalEmails: false,
      }

      mockPrismaNotificationSettings.findUnique.mockResolvedValue(settings)

      await NotificationService.sendNotification({
        type: NotificationType.PROMOTION,
        recipientEmail: 'customer@example.com',
        recipientName: 'Customer',
        userId: 'user1',
        subject: 'Special Offer',
        content: '<p>50% off everything!</p>',
      })

      expect(mockSendEmail).not.toHaveBeenCalled()
    })

    it('should send notifications when user has no settings', async () => {
      mockPrismaNotificationSettings.findUnique.mockResolvedValue(null)
      mockSendEmail.mockResolvedValue({ id: 'test' } as any)

      await NotificationService.sendNotification({
        type: NotificationType.WELCOME,
        recipientEmail: 'newuser@example.com',
        recipientName: 'New User',
        userId: 'user1',
      })

      // Should send when no settings exist (defaults to enabled)
      expect(mockSendEmail).toHaveBeenCalled()
    })

    it('should send notifications for users without userId', async () => {
      mockSendEmail.mockResolvedValue({ id: 'test' } as any)

      await NotificationService.sendNotification({
        type: NotificationType.ORDER_CONFIRMATION,
        recipientEmail: 'guest@example.com',
        recipientName: 'Guest User',
        orderNumber: 'ORD-GUEST-123',
        orderTotal: '€29.99',
        orderItems: [],
      })

      // Should not check preferences for users without userId
      expect(mockPrismaNotificationSettings.findUnique).not.toHaveBeenCalled()
      expect(mockSendEmail).toHaveBeenCalled()
    })

    it('should handle email sending failures', async () => {
      mockSendEmail.mockRejectedValue(new Error('Email service error'))

      await expect(
        NotificationService.sendNotification({
          type: NotificationType.WELCOME,
          recipientEmail: 'test@example.com',
          recipientName: 'Test User',
        }),
      ).rejects.toThrow('Email service error')
    })

    it('should throw error for unsupported notification type', async () => {
      await expect(
        NotificationService.sendNotification({
          type: 'UNSUPPORTED_TYPE' as NotificationType,
          recipientEmail: 'test@example.com',
          recipientName: 'Test User',
        } as any),
      ).rejects.toThrow('Unsupported notification type')
    })
  })

  describe('convenience methods', () => {
    beforeEach(() => {
      mockSendEmail.mockResolvedValue({ id: 'test' } as any)
    })

    it('should send welcome email using convenience method', async () => {
      await NotificationService.sendWelcomeEmail(
        'newuser@example.com',
        'New User',
        'user1',
        'https://example.com/verify?token=abc123',
      )

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'newuser@example.com',
        subject: 'Welcome to Malmequer! 🌼',
        html: '<h1>Welcome!</h1>',
      })
    })

    it('should send order confirmation using convenience method', async () => {
      const orderItems = [
        { name: 'Product 1', quantity: 2, price: '€24.99' },
        { name: 'Product 2', quantity: 1, price: '€19.99' },
      ]

      await NotificationService.sendOrderConfirmation(
        'customer@example.com',
        'Customer Name',
        'ORD-123456',
        '€69.97',
        orderItems,
        'user1',
      )

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'customer@example.com',
        subject: 'Order confirmation #ORD-123456',
        html: expect.stringContaining('Order Confirmed'),
      })
    })

    it('should send order shipped notification', async () => {
      const orderItems = [
        { name: 'Product 1', quantity: 1, price: '€29.99' },
      ]

      await NotificationService.sendOrderShipped(
        'customer@example.com',
        'Customer Name',
        'ORD-123456',
        '€29.99',
        orderItems,
        'user1',
        'https://tracking.example.com/123456',
      )

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'customer@example.com',
        subject: 'Your order #ORD-123456 has shipped! 📦',
        html: expect.stringContaining('Order Shipped'),
      })
    })

    it('should send password reset email', async () => {
      await NotificationService.sendPasswordReset(
        'user@example.com',
        'User Name',
        'https://example.com/reset?token=xyz789',
        'user1',
      )

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Reset your password - Malmequer',
        html: expect.stringContaining('Password Reset'),
      })
    })

    it('should send stock alert email', async () => {
      await NotificationService.sendStockAlert(
        'customer@example.com',
        'Customer Name',
        'iPhone 15 Pro',
        'https://example.com/products/iphone-15-pro',
        'user1',
      )

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'customer@example.com',
        subject: 'iPhone 15 Pro is back in stock! 🎉',
        html: expect.stringContaining('Back in Stock'),
      })
    })

    it('should send refund notification using convenience method', async () => {
      await NotificationService.sendRefundNotification(
        'customer@example.com',
        'Customer Name',
        'ORD-123456',
        '€49.99',
        'Product was defective',
        'user1',
      )

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'customer@example.com',
        subject: 'Refund processed for order #ORD-123456',
        html: expect.stringContaining('Refund Processed'),
      })
    })
  })

  describe('notification preferences handling', () => {
    it('should check preferences for different notification types', async () => {
      const settings = {
        emailNotifications: true,
        orderConfirmations: true,
        orderUpdates: false,
        stockAlerts: true,
        promotionalEmails: false,
        accountUpdates: true,
      }

      mockPrismaNotificationSettings.findUnique.mockResolvedValue(settings)
      mockSendEmail.mockResolvedValue({ id: 'test' } as any)

      // Should send order confirmation (enabled)
      await NotificationService.sendOrderConfirmation(
        'customer@example.com',
        'Customer',
        'ORD-123',
        '€49.99',
        [],
        'user1',
      )
      expect(mockSendEmail).toHaveBeenLastCalledWith(
        expect.objectContaining({
          subject: 'Order confirmation #ORD-123',
        }),
      )

      mockSendEmail.mockClear()

      // Should send stock alert (enabled)
      await NotificationService.sendStockAlert(
        'customer@example.com',
        'Customer',
        'Product Name',
        'https://example.com/product',
        'user1',
      )
      expect(mockSendEmail).toHaveBeenCalled()

      mockSendEmail.mockClear()

      // Should NOT send promotional email (disabled)
      await NotificationService.sendNotification({
        type: NotificationType.PROMOTION,
        recipientEmail: 'customer@example.com',
        recipientName: 'Customer',
        userId: 'user1',
        subject: 'Promotion',
        content: 'Content',
      })
      expect(mockSendEmail).not.toHaveBeenCalled()
    })

    it('should handle database errors when fetching preferences', async () => {
      mockPrismaNotificationSettings.findUnique.mockRejectedValue(
        new Error('Database error'),
      )
      mockSendEmail.mockResolvedValue({ id: 'test' } as any)

      // Should still send notification if preferences check fails
      await NotificationService.sendWelcomeEmail(
        'user@example.com',
        'User',
        'user1',
      )

      expect(mockSendEmail).toHaveBeenCalled()
    })
  })
})