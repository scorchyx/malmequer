import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { log } from '@/lib/logger'
import { NotificationService } from '@/lib/notification-service'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { orderId, reason } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 },
      )
    }

    // Get order with payment details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          where: { status: 'PAID' },
        },
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 },
      )
    }

    if (order.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { error: 'Order payment cannot be refunded' },
        { status: 400 },
      )
    }

    const payment = order.payments[0]
    if (!payment?.stripePaymentId) {
      return NextResponse.json(
        { error: 'No valid payment found for refund' },
        { status: 404 },
      )
    }

    // Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
      reason: 'requested_by_customer',
      metadata: {
        orderId: order.id,
        userId: user.id,
        autoRefund: 'true',
        reason: reason ??'Automatic refund',
      },
    })

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        metadata: {
          ...(payment.metadata as any),
          refundId: refund.id,
          refundAmount: refund.amount / 100,
          refundReason: reason ??'Automatic refund',
          autoRefund: true,
        },
      },
    })

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'REFUNDED',
      },
    })

    // Restore inventory for refunded items
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          inventory: {
            increment: item.quantity,
          },
        },
      })

      // Log inventory restoration
      await prisma.inventoryLog.create({
        data: {
          type: 'RETURN',
          quantity: item.quantity,
          reason: `Refund for order ${order.orderNumber}`,
          productId: item.productId,
          userId: user.id,
        },
      })
    }

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        action: 'AUTO_REFUND_ORDER',
        entityType: 'Order',
        entityId: orderId,
        description: `Auto-refunded €${refund.amount / 100} for order ${order.orderNumber}`,
        userId: user.id,
        newValues: {
          refundId: refund.id,
          amount: refund.amount / 100,
          reason: reason ??'Automatic refund',
          inventoryRestored: true,
        },
      },
    })

    // Send refund notification email
    try {
      const email = order.user?.email ??order.guestEmail
      const customerName = order.user?.name ??'Customer'

      if (email) {
        await NotificationService.sendRefundNotification(
          email,
          customerName,
          order.orderNumber,
          `€${refund.amount / 100}`,
          reason ??'Your order has been automatically refunded',
        )
      }
    } catch (emailError) {
      log.error('Failed to send auto-refund notification email', {
        error: emailError instanceof Error ? emailError : String(emailError),
        orderId,
        refundId: refund.id,
      })
    }

    log.info('Automatic refund processed successfully', {
      refundId: refund.id,
      amount: refund.amount / 100,
      orderId,
      adminId: user.id,
      inventoryRestored: true,
    })

    return NextResponse.json({
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
      inventoryRestored: true,
      orderStatus: 'REFUNDED',
    })
  } catch (error) {
    log.error('Error processing automatic refund', {
      error: error instanceof Error ? error : String(error),
      orderId: request.url,
    })
    return NextResponse.json(
      { error: 'Failed to process automatic refund' },
      { status: 500 },
    )
  }
}