import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { cache, CacheKeys, CacheTTL } from '@/lib/cache'
import { getGuestSessionId, setGuestSessionCookie } from '@/lib/guest-session'
import { log } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { validateRequestBody, addToCartSchema } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const response = NextResponse.json({}) // Initialize response for cookie setting

    let cartItems
    let cacheKey

    if (user) {
      // Authenticated user cart
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
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      // Guest user cart
      const sessionId = getGuestSessionId(request)

      // Set session cookie if new guest
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
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    const total = cartItems.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.price),
      0,
    )

    const result = {
      items: cartItems,
      total,
      count: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    }

    // Cache for 2 minutes
    await cache.set(cacheKey, result, CacheTTL.SHORT * 2)

    const finalResponse = NextResponse.json(result)

    // Ensure guest session cookie is set for new guests
    if (!user && !request.cookies.get('guest_session_id')?.value) {
      setGuestSessionCookie(finalResponse, getGuestSessionId(request))
    }

    return finalResponse
  } catch (error) {
    log.error('Failed to fetch cart', {
      error: error instanceof Error ? error : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    // Validate request body
    const validation = await validateRequestBody(addToCartSchema)(request)
    if (!validation.success) {
      return validation.response
    }

    const { productId, quantity } = validation.data

    let cartItem
    let cacheKey

    if (user) {
      // Authenticated user cart
      const existingItem = await prisma.cartItem.findUnique({
        where: {
          userId_productId: {
            userId: user.id,
            productId,
          },
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
          },
        })
      } else {
        cartItem = await prisma.cartItem.create({
          data: {
            userId: user.id,
            productId,
            quantity,
          },
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { order: 'asc' } },
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
        details: { productId, quantity },
      })
    } else {
      // Guest user cart
      const sessionId = getGuestSessionId(request)

      const existingItem = await prisma.cartItem.findUnique({
        where: {
          sessionId_productId: {
            sessionId,
            productId,
          },
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
          },
        })
      } else {
        cartItem = await prisma.cartItem.create({
          data: {
            sessionId,
            productId,
            quantity,
          },
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { order: 'asc' } },
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
        details: { productId, quantity },
      })
    }

    // Invalidate cart cache
    await cache.del(cacheKey)

    const response = NextResponse.json(cartItem, { status: 201 })

    // Set guest session cookie if needed
    if (!user && !request.cookies.get('guest_session_id')?.value) {
      setGuestSessionCookie(response, getGuestSessionId(request))
    }

    return response
  } catch (error) {
    log.error('Failed to add to cart', {
      error: error instanceof Error ? error : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 },
      )
    }

    let cartItem
    let cacheKey

    if (user) {
      // Authenticated user cart
      cartItem = await prisma.cartItem.findUnique({
        where: {
          userId_productId: {
            userId: user.id,
            productId,
          },
        },
        include: {
          product: true,
        },
      })

      cacheKey = CacheKeys.userCart(user.id)

      if (cartItem) {
        log.businessEvent('Item removed from cart', {
          event: 'cart_remove_item',
          userId: user.id,
          entityType: 'cart_item',
          entityId: cartItem.id,
          details: { productId, productName: cartItem.product.name },
        })
      }
    } else {
      // Guest user cart
      const sessionId = getGuestSessionId(request)

      cartItem = await prisma.cartItem.findUnique({
        where: {
          sessionId_productId: {
            sessionId,
            productId,
          },
        },
        include: {
          product: true,
        },
      })

      cacheKey = `guest_cart:${sessionId}`

      if (cartItem) {
        log.businessEvent('Item removed from guest cart', {
          event: 'guest_cart_remove_item',
          sessionId,
          entityType: 'cart_item',
          entityId: cartItem.id,
          details: { productId, productName: cartItem.product.name },
        })
      }
    }

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 },
      )
    }

    await prisma.cartItem.delete({
      where: { id: cartItem.id },
    })

    // Invalidate cart cache
    await cache.del(cacheKey)

    const response = NextResponse.json(
      { message: 'Item removed from cart', item: cartItem },
      { status: 200 },
    )

    // Set guest session cookie if needed
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