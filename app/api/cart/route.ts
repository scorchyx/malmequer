import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { cache, CacheKeys, CacheTTL } from '@/lib/cache'
import { getGuestSessionId, setGuestSessionCookie } from '@/lib/guest-session'
import { log } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Updated schema for new stock system
const addToCartSchema = z.object({
  productId: z.string().min(1),
  stockItemId: z.string().min(1).optional(),
  quantity: z.number().int().positive().default(1),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const response = NextResponse.json({})

    let cartItems
    let cacheKey

    if (user) {
      cacheKey = CacheKeys.userCart(user.id)
      const cachedCart = await cache.get(cacheKey)
      if (cachedCart) {
        return NextResponse.json(cachedCart)
      }

      cartItems = await prisma.cartItem.findMany({
        where: { userId: user.id },
        include: {
          product: {
            include: {
              images: { take: 1, orderBy: { order: 'asc' } },
              category: true,
            },
          },
          stockItem: {
            include: {
              sizeVariant: true,
              colorVariant: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      const sessionId = getGuestSessionId(request)

      if (!request.cookies.get('guest_session_id')?.value) {
        setGuestSessionCookie(response, sessionId)
      }

      cacheKey = `guest_cart:${sessionId}`
      const cachedCart = await cache.get(cacheKey)
      if (cachedCart) {
        const result = NextResponse.json(cachedCart)
        if (!request.cookies.get('guest_session_id')?.value) {
          setGuestSessionCookie(result, sessionId)
        }
        return result
      }

      cartItems = await prisma.cartItem.findMany({
        where: { sessionId },
        include: {
          product: {
            include: {
              images: { take: 1, orderBy: { order: 'asc' } },
              category: true,
            },
          },
          stockItem: {
            include: {
              sizeVariant: true,
              colorVariant: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    // Calculate total with price extras from variants
    const total = cartItems.reduce((sum, item) => {
      let price = Number(item.product.price)
      if (item.stockItem?.sizeVariant?.priceExtra) {
        price += Number(item.stockItem.sizeVariant.priceExtra)
      }
      if (item.stockItem?.colorVariant?.priceExtra) {
        price += Number(item.stockItem.colorVariant.priceExtra)
      }
      return sum + item.quantity * price
    }, 0)

    const result = {
      items: cartItems,
      total,
      count: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    }

    await cache.set(cacheKey, result, CacheTTL.SHORT * 2)

    const finalResponse = NextResponse.json(result)

    if (!user && !request.cookies.get('guest_session_id')?.value) {
      setGuestSessionCookie(finalResponse, getGuestSessionId(request))
    }

    return finalResponse
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    log.error('Failed to fetch cart', {
      error: errorMessage,
      stack: errorStack,
    })
    return NextResponse.json(
      { error: 'Failed to fetch cart', details: errorMessage },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    const body = await request.json()
    const validation = addToCartSchema.safeParse(body)
    if (!validation.success) {
      log.warn('Cart validation failed', { errors: validation.error.issues })
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 },
      )
    }

    const { productId, stockItemId, quantity } = validation.data

    log.info('Adding to cart', { productId, stockItemId, quantity, userId: user?.id })

    // Validate stock availability if stockItemId provided
    if (stockItemId) {
      const stockItem = await prisma.stockItem.findUnique({
        where: { id: stockItemId },
      })

      if (!stockItem) {
        return NextResponse.json(
          { error: 'Stock item not found' },
          { status: 404 },
        )
      }

      if (stockItem.quantity < quantity) {
        return NextResponse.json(
          { error: 'Insufficient stock', available: stockItem.quantity },
          { status: 400 },
        )
      }
    }

    let cartItem
    let cacheKey

    if (user) {
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          userId: user.id,
          productId,
          stockItemId: stockItemId || null,
        },
      })

      if (existingItem) {
        cartItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { order: 'asc' } },
              },
            },
            stockItem: {
              include: {
                sizeVariant: true,
                colorVariant: true,
              },
            },
          },
        })
      } else {
        cartItem = await prisma.cartItem.create({
          data: {
            userId: user.id,
            productId,
            stockItemId: stockItemId || null,
            quantity,
          },
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { order: 'asc' } },
              },
            },
            stockItem: {
              include: {
                sizeVariant: true,
                colorVariant: true,
              },
            },
          },
        })
      }

      cacheKey = CacheKeys.userCart(user.id)

      log.businessEvent('Item added to cart', {
        event: 'cart_add_item',
        userId: user.id,
        entityType: 'cart_item',
        entityId: cartItem.id,
        details: { productId, stockItemId, quantity },
      })
    } else {
      const sessionId = getGuestSessionId(request)

      const existingItem = await prisma.cartItem.findFirst({
        where: {
          sessionId,
          productId,
          stockItemId: stockItemId || null,
        },
      })

      if (existingItem) {
        cartItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { order: 'asc' } },
              },
            },
            stockItem: {
              include: {
                sizeVariant: true,
                colorVariant: true,
              },
            },
          },
        })
      } else {
        cartItem = await prisma.cartItem.create({
          data: {
            sessionId,
            productId,
            stockItemId: stockItemId || null,
            quantity,
          },
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { order: 'asc' } },
              },
            },
            stockItem: {
              include: {
                sizeVariant: true,
                colorVariant: true,
              },
            },
          },
        })
      }

      cacheKey = `guest_cart:${sessionId}`

      log.businessEvent('Item added to guest cart', {
        event: 'guest_cart_add_item',
        sessionId,
        entityType: 'cart_item',
        entityId: cartItem.id,
        details: { productId, stockItemId, quantity },
      })
    }

    await cache.del(cacheKey)

    const response = NextResponse.json(cartItem, { status: 201 })

    if (!user && !request.cookies.get('guest_session_id')?.value) {
      setGuestSessionCookie(response, getGuestSessionId(request))
    }

    return response
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    log.error('Failed to add to cart', {
      error: errorMessage,
      stack: errorStack,
    })
    return NextResponse.json(
      { error: 'Failed to add to cart', details: errorMessage },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const stockItemId = searchParams.get('stockItemId')

    log.info('DELETE cart request', {
      productId,
      stockItemId,
      userId: user?.id,
    })

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 },
      )
    }

    let cartItem: any
    let cacheKey

    if (user) {
      const items = await prisma.cartItem.findMany({
        where: {
          userId: user.id,
          productId,
        },
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

      log.info('Found cart items for user', {
        userId: user.id,
        productId,
        itemsCount: items.length,
        items: items.map(i => ({
          id: i.id,
          productId: i.productId,
          stockItemId: i.stockItemId,
          quantity: i.quantity,
        })),
      })

      cartItem = items.find(item =>
        stockItemId ? item.stockItemId === stockItemId : item.stockItemId === null
      )

      cacheKey = CacheKeys.userCart(user.id)

      if (cartItem?.product) {
        log.businessEvent('Item removed from cart', {
          event: 'cart_remove_item',
          userId: user.id,
          entityType: 'cart_item',
          entityId: cartItem.id,
          details: { productId, stockItemId, productName: cartItem.product.name },
        })
      }
    } else {
      const sessionId = getGuestSessionId(request)

      const items = await prisma.cartItem.findMany({
        where: {
          sessionId,
          productId,
        },
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

      log.info('Found cart items for guest', {
        sessionId,
        productId,
        itemsCount: items.length,
        items: items.map(i => ({
          id: i.id,
          productId: i.productId,
          stockItemId: i.stockItemId,
          quantity: i.quantity,
        })),
      })

      cartItem = items.find(item =>
        stockItemId ? item.stockItemId === stockItemId : item.stockItemId === null
      )

      cacheKey = `guest_cart:${sessionId}`

      if (cartItem?.product) {
        log.businessEvent('Item removed from guest cart', {
          event: 'guest_cart_remove_item',
          sessionId,
          entityType: 'cart_item',
          entityId: cartItem.id,
          details: { productId, stockItemId, productName: cartItem.product.name },
        })
      }
    }

    if (!cartItem) {
      log.warn('Cart item not found', {
        productId,
        stockItemId,
        userId: user?.id,
      })
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 },
      )
    }

    await prisma.cartItem.delete({
      where: { id: cartItem.id },
    })

    await cache.del(cacheKey)

    const response = NextResponse.json(
      { message: 'Item removed from cart', item: cartItem },
      { status: 200 },
    )

    if (!user && !request.cookies.get('guest_session_id')?.value) {
      setGuestSessionCookie(response, getGuestSessionId(request))
    }

    return response
  } catch (error) {
    log.error('Failed to remove from cart', {
      error: error instanceof Error ? error : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to remove from cart' },
      { status: 500 },
    )
  }
}
