import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 },
      )
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
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

    if (order.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 },
      )
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(order.totalAmount) * 100), // Convert to cents
      currency: 'eur',
      metadata: {
        orderId: order.id,
        userId: user.id,
        orderNumber: order.orderNumber,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        amount: order.totalAmount,
        currency: 'eur',
        stripePaymentId: paymentIntent.id,
        orderId: order.id,
        metadata: {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
        },
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 },
    )
  }
}