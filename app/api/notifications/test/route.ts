import { NextRequest, NextResponse } from "next/server"
import { NotificationService, NotificationType } from "@/lib/notification-service"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { type, recipientEmail, recipientName, ...params } = await request.json()

    if (!type || !recipientEmail || !recipientName) {
      return NextResponse.json(
        { error: "Type, recipientEmail, and recipientName are required" },
        { status: 400 }
      )
    }

    // Validate notification type
    if (!Object.values(NotificationType).includes(type)) {
      return NextResponse.json(
        { error: "Invalid notification type" },
        { status: 400 }
      )
    }

    let notificationData: any = {
      type,
      recipientEmail,
      recipientName,
    }

    // Add type-specific parameters
    switch (type) {
      case NotificationType.WELCOME:
        notificationData.verificationUrl = params.verificationUrl || "https://localhost:3000/verify"
        break

      case NotificationType.ORDER_CONFIRMATION:
      case NotificationType.ORDER_SHIPPED:
        notificationData = {
          ...notificationData,
          orderNumber: params.orderNumber || "TEST-001",
          orderTotal: params.orderTotal || "€49.99",
          orderItems: params.orderItems || [
            { name: "Produto Teste", quantity: 1, price: "€49.99" }
          ],
          trackingUrl: params.trackingUrl || "https://tracking-example.com/123"
        }
        break

      case NotificationType.PASSWORD_RESET:
        notificationData.resetUrl = params.resetUrl || "https://localhost:3000/reset-password"
        break

      case NotificationType.STOCK_ALERT:
        notificationData = {
          ...notificationData,
          productName: params.productName || "Produto Teste",
          productUrl: params.productUrl || "https://localhost:3000/products/test"
        }
        break
    }

    await NotificationService.sendNotification(notificationData)

    return NextResponse.json({
      message: "Test notification sent successfully",
      type,
      recipientEmail
    })
  } catch (error) {
    console.error("Error sending test notification:", error)
    return NextResponse.json(
      {
        error: "Failed to send test notification",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}