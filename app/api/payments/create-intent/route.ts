import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { cache, CacheKeys } from '@/lib/cache'
import { getGuestSessionId } from '@/lib/guest-session'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    const body = await request.json()
    const { shippingAddress, paymentMethod = 'card' } = body

    if (!shippingAddress) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 },
      )
    }

    // Get cart items
    let cartItems
    if (user) {
      cartItems = await prisma.cartItem.findMany({
        where: { userId: user.id },
        include: {
          product: true,
          stockItem: {
            include: {
              sizeVariant: true,
              colorVariant: true,
            },
          },
        },
      })
    } else {
      const sessionId = getGuestSessionId(request)
      cartItems = await prisma.cartItem.findMany({
        where: { sessionId },
        include: {
          product: true,
          stockItem: {
            include: {
              sizeVariant: true,
              colorVariant: true,
            },
          },
        },
      })
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 },
      )
    }

    // Calculate totals (including price extras from variants)
    const subtotalAmount = cartItems.reduce(
      (sum, item) => {
        let price = Number(item.product.price)
        if (item.stockItem?.sizeVariant?.priceExtra) {
          price += Number(item.stockItem.sizeVariant.priceExtra)
        }
        if (item.stockItem?.colorVariant?.priceExtra) {
          price += Number(item.stockItem.colorVariant.priceExtra)
        }
        return sum + item.quantity * price
      },
      0,
    )
    const taxAmount = subtotalAmount * 0.23 // 23% IVA Portugal
    const shippingAmount = subtotalAmount > 50 ? 0 : 5.99 // Free shipping over €50
    const totalAmount = subtotalAmount + taxAmount + shippingAmount

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Create shipping address
    const createdShippingAddress = await prisma.address.create({
      data: {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        phone: shippingAddress.phone,
        type: 'SHIPPING',
        ...(user ? { userId: user.id } : { sessionId: getGuestSessionId(request) }),
      },
    })

    // Create billing address (same as shipping for now)
    const createdBillingAddress = await prisma.address.create({
      data: {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        phone: shippingAddress.phone,
        type: 'BILLING',
        ...(user ? { userId: user.id } : { sessionId: getGuestSessionId(request) }),
      },
    })

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        ...(user ? { userId: user.id } : {
          sessionId: getGuestSessionId(request),
          guestEmail: shippingAddress.email,
          guestPhone: shippingAddress.phone,
        }),
        subtotalAmount,
        taxAmount,
        shippingAmount,
        totalAmount,
        paymentMethod,
        shippingMethod: 'STANDARD',
        shippingAddressId: createdShippingAddress.id,
        billingAddressId: createdBillingAddress.id,
        paymentStatus: 'PENDING',
        status: 'PENDING',
        items: {
          create: cartItems.map((item) => {
            let price = Number(item.product.price)
            if (item.stockItem?.sizeVariant?.priceExtra) {
              price += Number(item.stockItem.sizeVariant.priceExtra)
            }
            if (item.stockItem?.colorVariant?.priceExtra) {
              price += Number(item.stockItem.colorVariant.priceExtra)
            }
            return {
              productId: item.productId,
              name: item.product.name,
              quantity: item.quantity,
              price,
              stockItemId: item.stockItemId || null,
              sizeLabel: item.stockItem?.sizeVariant?.label || null,
              sizeValue: item.stockItem?.sizeVariant?.value || null,
              colorLabel: item.stockItem?.colorVariant?.label || null,
              colorValue: item.stockItem?.colorVariant?.value || null,
            }
          }),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'eur',
      metadata: {
        orderId: order.id,
        userId: user?.id || 'guest',
        orderNumber: order.orderNumber,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        amount: totalAmount,
        currency: 'eur',
        stripePaymentId: paymentIntent.id,
        orderId: order.id,
        status: 'PENDING',
        paymentMethod: 'card',
        metadata: {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
        },
      },
    })

    // NOTE: Cart is NOT cleared here - it will be cleared when payment succeeds
    // via the Stripe webhook to ensure users don't lose their cart if they cancel

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 },
    )
  }
}