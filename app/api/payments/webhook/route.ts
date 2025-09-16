import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { NotificationService } from "@/lib/notification-service"
import { headers } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get("stripe-signature")

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 400 }
      )
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      )
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object
        await handleSuccessfulPayment(paymentIntent)
        break

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object
        await handleFailedPayment(failedPayment)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

async function handleSuccessfulPayment(paymentIntent: any) {
  try {
    const orderId = paymentIntent.metadata.orderId

    if (!orderId) {
      console.error("No orderId in payment intent metadata")
      return
    }

    // Update payment record
    await prisma.payment.update({
      where: { stripePaymentId: paymentIntent.id },
      data: {
        status: "PAID",
        paymentMethod: paymentIntent.payment_method_types?.[0] || "card",
      },
    })

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
      },
    })

    // Update inventory for ordered items and send confirmation email
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true }
        },
        user: true
      },
    })

    if (order) {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            inventory: {
              decrement: item.quantity,
            },
          },
        })

        // Log inventory change
        await prisma.inventoryLog.create({
          data: {
            type: "SALE",
            quantity: -item.quantity,
            reason: `Sale from order ${order.orderNumber}`,
            productId: item.productId,
            userId: order.userId,
          },
        })
      }

      // Send order confirmation email
      const orderItems = order.items.map((item: any) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: `€${item.price}`
      }))

      NotificationService.sendOrderConfirmation(
        order.user.email,
        order.user.name,
        order.orderNumber,
        `€${order.total}`,
        orderItems,
        order.user.id
      ).catch(error =>
        console.error("Failed to send order confirmation email:", error)
      )
    }

    console.log(`Payment successful for order ${orderId}`)
  } catch (error) {
    console.error("Error handling successful payment:", error)
  }
}

async function handleFailedPayment(paymentIntent: any) {
  try {
    const orderId = paymentIntent.metadata.orderId

    if (!orderId) {
      console.error("No orderId in payment intent metadata")
      return
    }

    // Update payment record
    await prisma.payment.update({
      where: { stripePaymentId: paymentIntent.id },
      data: {
        status: "FAILED",
      },
    })

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "FAILED",
      },
    })

    console.log(`Payment failed for order ${orderId}`)
  } catch (error) {
    console.error("Error handling failed payment:", error)
  }
}