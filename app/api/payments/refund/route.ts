import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
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

    const { paymentId, amount, reason } = await request.json()

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 },
      )
    }

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    })

    if (!payment || !payment.stripePaymentId) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 },
      )
    }

    if (payment.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Payment cannot be refunded' },
        { status: 400 },
      )
    }

    // Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
      amount: amount ? Math.round(Number(amount) * 100) : undefined, // Convert to cents
      reason: reason ?? 'requested_by_customer',
      metadata: {
        orderId: payment.orderId,
        userId: user.id,
        adminReason: reason ?? 'Admin refund',
      },
    })

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
        metadata: {
          ...(payment.metadata as any),
          refundId: refund.id,
          refundAmount: refund.amount / 100,
          refundReason: reason,
        },
      },
    })

    // Update order status
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'REFUNDED',
      },
    })

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        action: 'REFUND_PAYMENT',
        entityType: 'Payment',
        entityId: paymentId,
        description: `Refunded ${refund.amount / 100}€ for order ${payment.order.orderNumber}`,
        userId: user.id,
        newValues: {
          refundId: refund.id,
          amount: refund.amount / 100,
          reason,
        },
      },
    })

    return NextResponse.json({
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
    })
  } catch (error) {
    console.error('Error processing refund:', error)
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 },
    )
  }
}