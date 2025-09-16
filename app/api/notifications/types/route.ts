import { NextResponse } from "next/server"
import { NotificationType } from "@/lib/notification-service"

export async function GET() {
  try {
    const notificationTypes = Object.values(NotificationType).map(type => ({
      type,
      description: getNotificationDescription(type),
      requiredParams: getRequiredParams(type)
    }))

    return NextResponse.json({
      notificationTypes
    })
  } catch (error) {
    console.error("Error fetching notification types:", error)
    return NextResponse.json(
      { error: "Failed to fetch notification types" },
      { status: 500 }
    )
  }
}

function getNotificationDescription(type: NotificationType): string {
  switch (type) {
    case NotificationType.WELCOME:
      return "Email de boas-vindas para novos utilizadores"
    case NotificationType.ORDER_CONFIRMATION:
      return "Confirmação de encomenda após pagamento"
    case NotificationType.ORDER_SHIPPED:
      return "Notificação de envio de encomenda"
    case NotificationType.ORDER_DELIVERED:
      return "Confirmação de entrega de encomenda"
    case NotificationType.PASSWORD_RESET:
      return "Email para redefinir palavra-passe"
    case NotificationType.STOCK_ALERT:
      return "Alerta de produto novamente em stock"
    case NotificationType.PROMOTION:
      return "Email promocional"
    case NotificationType.ACCOUNT_UPDATE:
      return "Atualizações de conta"
    default:
      return "Tipo de notificação desconhecido"
  }
}

function getRequiredParams(type: NotificationType): string[] {
  const baseParams = ["recipientEmail", "recipientName"]

  switch (type) {
    case NotificationType.WELCOME:
      return [...baseParams, "verificationUrl?"]
    case NotificationType.ORDER_CONFIRMATION:
    case NotificationType.ORDER_SHIPPED:
      return [...baseParams, "orderNumber", "orderTotal", "orderItems", "trackingUrl?"]
    case NotificationType.PASSWORD_RESET:
      return [...baseParams, "resetUrl"]
    case NotificationType.STOCK_ALERT:
      return [...baseParams, "productName", "productUrl"]
    default:
      return baseParams
  }
}