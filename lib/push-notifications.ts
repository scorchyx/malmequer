import { sendNotification, type Notification } from '@/app/api/notifications/stream/route'

// Notification utility functions
export class PushNotificationService {
  // Send order update notification
  static sendOrderUpdate(
    userId: string,
    orderId: string,
    orderNumber: string,
    status: string,
    message?: string,
  ) {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: 'order_update',
      title: `Order ${orderNumber} Updated`,
      message: message ?? `Your order status has been updated to: ${status}`,
      data: {
        orderId,
        orderNumber,
        status,
      },
      userId,
      timestamp: Date.now(),
    }

    sendNotification(notification)
  }

  // Send payment update notification
  static sendPaymentUpdate(
    userId: string,
    orderId: string,
    orderNumber: string,
    paymentStatus: string,
    amount?: number,
  ) {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: 'payment_update',
      title: `Payment ${paymentStatus}`,
      message: amount
        ? `Payment of €${amount.toFixed(2)} for order ${orderNumber} is ${paymentStatus.toLowerCase()}`
        : `Payment for order ${orderNumber} is ${paymentStatus.toLowerCase()}`,
      data: {
        orderId,
        orderNumber,
        paymentStatus,
        amount,
      },
      userId,
      timestamp: Date.now(),
    }

    sendNotification(notification)
  }

  // Send stock alert to admins
  static sendStockAlert(
    productId: string,
    productName: string,
    currentStock: number,
    threshold: number = 10,
  ) {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: 'stock_alert',
      title: 'Low Stock Alert',
      message: `${productName} has low stock: ${currentStock} units remaining`,
      data: {
        productId,
        productName,
        currentStock,
        threshold,
      },
      isAdminOnly: true,
      timestamp: Date.now(),
    }

    sendNotification(notification)
  }

  // Send admin alert
  static sendAdminAlert(
    title: string,
    message: string,
    data?: Record<string, unknown>,
    alertType: 'info' | 'warning' | 'error' = 'info',
  ) {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: 'admin_alert',
      title,
      message,
      data: {
        ...data,
        alertType,
      },
      isAdminOnly: true,
      timestamp: Date.now(),
    }

    sendNotification(notification)
  }

  // Send system message to all users
  static sendSystemMessage(
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ) {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: 'system_message',
      title,
      message,
      data,
      timestamp: Date.now(),
    }

    sendNotification(notification)
  }

  // Send welcome message to new user
  static sendWelcomeMessage(userId: string, userName: string) {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: 'system_message',
      title: 'Welcome!',
      message: `Welcome to our store, ${userName}! Start exploring our products.`,
      userId,
      timestamp: Date.now(),
    }

    sendNotification(notification)
  }

  // Send cart abandonment reminder
  static sendCartReminder(userId: string, cartItemCount: number) {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: 'system_message',
      title: 'Don\'t forget your cart!',
      message: `You have ${cartItemCount} item${cartItemCount > 1 ? 's' : ''} waiting in your cart.`,
      data: {
        cartItemCount,
      },
      userId,
      timestamp: Date.now(),
    }

    sendNotification(notification)
  }

  // Send back in stock notification
  static sendBackInStockNotification(
    userId: string,
    productId: string,
    productName: string,
  ) {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: 'stock_alert',
      title: 'Back in Stock!',
      message: `Good news! ${productName} is back in stock.`,
      data: {
        productId,
        productName,
      },
      userId,
      timestamp: Date.now(),
    }

    sendNotification(notification)
  }

  // Send price drop notification
  static sendPriceDropNotification(
    userId: string,
    productId: string,
    productName: string,
    oldPrice: number,
    newPrice: number,
  ) {
    const savings = oldPrice - newPrice
    const percentage = Math.round((savings / oldPrice) * 100)

    const notification: Notification = {
      id: crypto.randomUUID(),
      type: 'system_message',
      title: 'Price Drop Alert!',
      message: `${productName} is now €${newPrice.toFixed(2)} (${percentage}% off)`,
      data: {
        productId,
        productName,
        oldPrice,
        newPrice,
        savings,
        percentage,
      },
      userId,
      timestamp: Date.now(),
    }

    sendNotification(notification)
  }

  // Send order shipped notification
  static sendOrderShippedNotification(
    userId: string,
    orderId: string,
    orderNumber: string,
    trackingNumber?: string,
    carrier?: string,
  ) {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: 'order_update',
      title: 'Order Shipped!',
      message: trackingNumber
        ? `Your order ${orderNumber} has been shipped. Tracking: ${trackingNumber}`
        : `Your order ${orderNumber} has been shipped.`,
      data: {
        orderId,
        orderNumber,
        trackingNumber,
        carrier,
        status: 'SHIPPED',
      },
      userId,
      timestamp: Date.now(),
    }

    sendNotification(notification)
  }

  // Send refund processed notification
  static sendRefundProcessedNotification(
    userId: string,
    orderId: string,
    orderNumber: string,
    refundAmount: number,
  ) {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: 'payment_update',
      title: 'Refund Processed',
      message: `Your refund of €${refundAmount.toFixed(2)} for order ${orderNumber} has been processed.`,
      data: {
        orderId,
        orderNumber,
        refundAmount,
        type: 'refund',
      },
      userId,
      timestamp: Date.now(),
    }

    sendNotification(notification)
  }
}

export default PushNotificationService