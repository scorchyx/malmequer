import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification-service'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { cache, CacheKeys } from '@/lib/cache'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = (await headers()).get('stripe-signature')

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 },
      )
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 },
      )
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        await handleSuccessfulPayment(paymentIntent)
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object
        await handleFailedPayment(failedPayment)
        break

      case 'charge.succeeded':
        const charge = event.data.object
        await handleChargeSucceeded(charge)
        break

      case 'source.chargeable':
        const source = event.data.object
        await handleSourceChargeable(source)
        break

      case 'source.failed':
        const failedSource = event.data.object
        await handleSourceFailed(failedSource)
        break

      case 'source.canceled':
        const canceledSource = event.data.object
        await handleSourceCanceled(canceledSource)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 },
    )
  }
}

async function handleSuccessfulPayment(paymentIntent: any) {
  try {
    const orderId = paymentIntent.metadata.orderId

    if (!orderId) {
      console.error('No orderId in payment intent metadata')
      return
    }

    // Update payment record
    await prisma.payment.update({
      where: { stripePaymentId: paymentIntent.id },
      data: {
        status: 'PAID',
        paymentMethod: paymentIntent.payment_method_types?.[0] ?? 'card',
      },
    })

    // Update order status
    await prisma.order.update({
      where: { id: orderId! },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
      },
    })

    // Update inventory for ordered items and send confirmation email
    const order = await prisma.order.findUnique({
      where: { id: orderId! },
      include: {
        items: {
          include: {
            product: true,
            stockItem: true,
          },
        },
        user: true,
      },
    })

    if (order) {
      for (const item of order.items) {
        // Decrement stock from the specific StockItem
        if (item.stockItemId) {
          await prisma.stockItem.update({
            where: { id: item.stockItemId },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          })
        }

        // Log inventory change
        await prisma.inventoryLog.create({
          data: {
            type: 'SALE',
            quantity: -item.quantity,
            reason: `Sale from order ${order.orderNumber}`,
            productId: item.productId,
            userId: order.userId,
          },
        })
      }

      // Clear cart after successful payment
      if (order.userId) {
        await prisma.cartItem.deleteMany({
          where: { userId: order.userId },
        })
        await cache.del(CacheKeys.userCart(order.userId))
      } else if (order.sessionId) {
        await prisma.cartItem.deleteMany({
          where: { sessionId: order.sessionId },
        })
        await cache.del(`guest_cart:${order.sessionId}`)
      }

      // Send order confirmation email
      if (order.user) {
        const orderItems = order.items.map((item: any) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: `€${item.price}`,
        }))

        NotificationService.sendOrderConfirmation(
          order.user.email,
          order.user.name ?? 'Customer',
          order.orderNumber,
          `€${order.totalAmount}`,
          orderItems,
          order.user.id,
        ).catch(error =>
          console.error('Failed to send order confirmation email:', error),
        )
      }
    }

    console.log(`Payment successful for order ${orderId}`)
  } catch (error) {
    console.error('Error handling successful payment:', error)
  }
}

async function handleFailedPayment(paymentIntent: any) {
  try {
    const orderId = paymentIntent.metadata.orderId

    if (!orderId) {
      console.error('No orderId in payment intent metadata')
      return
    }

    // Update payment record
    await prisma.payment.update({
      where: { stripePaymentId: paymentIntent.id },
      data: {
        status: 'FAILED',
      },
    })

    // Update order status
    await prisma.order.update({
      where: { id: orderId! },
      data: {
        paymentStatus: 'FAILED',
      },
    })

    console.log(`Payment failed for order ${orderId}`)
  } catch (error) {
    console.error('Error handling failed payment:', error)
  }
}

// Handle Multibanco/MB WAY charge succeeded
async function handleChargeSucceeded(charge: any) {
  try {
    const orderId = charge.metadata?.orderId
    const paymentMethod = charge.payment_method_details?.type

    if (!orderId) {
      console.error('No orderId in charge metadata')
      return
    }

    // For Multibanco/MB WAY payments
    if (paymentMethod === 'multibanco' || paymentMethod === 'mb_way') {
      await prisma.payment.updateMany({
        where: {
          orderId: orderId,
          status: 'PENDING',
        },
        data: {
          status: 'PAID',
          paymentMethod: paymentMethod,
          stripePaymentId: charge.id,
        },
      })

      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
        },
      })

      // Update inventory and send notification
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { product: true } },
          user: true,
        },
      })

      if (order) {
        for (const item of order.items) {
          // Decrement stock from the specific StockItem
          if (item.stockItemId) {
            await prisma.stockItem.update({
              where: { id: item.stockItemId },
              data: {
                quantity: {
                  decrement: item.quantity,
                },
              },
            })
          }

          await prisma.inventoryLog.create({
            data: {
              type: 'SALE',
              quantity: -item.quantity,
              reason: `${paymentMethod.toUpperCase()} payment for order ${order.orderNumber}`,
              productId: item.productId,
              userId: order.userId,
            },
          })
        }

        // Clear cart after successful payment
        if (order.userId) {
          await prisma.cartItem.deleteMany({
            where: { userId: order.userId },
          })
          await cache.del(CacheKeys.userCart(order.userId))
        } else if (order.sessionId) {
          await prisma.cartItem.deleteMany({
            where: { sessionId: order.sessionId },
          })
          await cache.del(`guest_cart:${order.sessionId}`)
        }

        // Send confirmation email
        if (order.user) {
          const orderItems = order.items.map((item: any) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: `€${item.price}`,
          }))

          await NotificationService.sendOrderConfirmation(
            order.user.email,
            order.user.name ?? 'Customer',
            order.orderNumber,
            `€${order.totalAmount}`,
            orderItems,
            order.user.id,
          )
        } else if (order.guestEmail) {
          // Handle guest orders
          const orderItems = order.items.map((item: any) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: `€${item.price}`,
          }))

          await NotificationService.sendOrderConfirmation(
            order.guestEmail,
            'Guest Customer',
            order.orderNumber,
            `€${order.totalAmount}`,
            orderItems,
            undefined,
          )
        }
      }

      console.log(`${paymentMethod.toUpperCase()} payment confirmed for order ${orderId}`)
    }
  } catch (error) {
    console.error('Error handling charge succeeded:', error)
  }
}

// Handle source chargeable (for Multibanco)
async function handleSourceChargeable(source: any) {
  try {
    const orderId = source.metadata?.orderId

    if (orderId && source.type === 'multibanco') {
      console.log(`Multibanco reference generated for order ${orderId}:`)
      console.log(`Entity: ${source.multibanco?.entity}`)
      console.log(`Reference: ${source.multibanco?.reference}`)

      // You could store these details or send them to the customer
      await prisma.order.update({
        where: { id: orderId },
        data: {
          notes: `Multibanco - Entity: ${source.multibanco?.entity}, Reference: ${source.multibanco?.reference}`,
        },
      })
    }
  } catch (error) {
    console.error('Error handling source chargeable:', error)
  }
}

// Handle source failed
async function handleSourceFailed(source: any) {
  try {
    const orderId = source.metadata?.orderId

    if (!orderId) {
      console.error('No orderId in source metadata')
      return
    }

    await prisma.payment.updateMany({
      where: {
        orderId: orderId,
        status: 'PENDING',
      },
      data: {
        status: 'FAILED',
      },
    })

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'FAILED',
      },
    })

    console.log(`Payment source failed for order ${orderId}`)
  } catch (error) {
    console.error('Error handling source failed:', error)
  }
}

// Handle source canceled
async function handleSourceCanceled(source: any) {
  try {
    const orderId = source.metadata?.orderId

    if (!orderId) {
      console.error('No orderId in source metadata')
      return
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'FAILED',
      },
    })

    console.log(`Payment source canceled for order ${orderId}`)
  } catch (error) {
    console.error('Error handling source canceled:', error)
  }
}