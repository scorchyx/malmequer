import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { validateRequestBody, addToCartSchema } from "@/lib/validation"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Try cache first
    const cacheKey = CacheKeys.userCart(user.id)
    const cachedCart = await cache.get(cacheKey)
    if (cachedCart) {
      return NextResponse.json(cachedCart)
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: { order: "asc" } },
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const total = cartItems.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.price),
      0
    )

    const result = {
      items: cartItems,
      total,
      count: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    }

    // Cache for 2 minutes
    await cache.set(cacheKey, result, CacheTTL.SHORT * 2)

    return NextResponse.json(result)
  } catch (error) {
    log.error('Failed to fetch cart', {
      error: error instanceof Error ? error : String(error)
    })
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Validate request body
    const validation = await validateRequestBody(addToCartSchema)(request)
    if (!validation.success) {
      return validation.response
    }

    const { productId, quantity } = validation.data

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    })

    let cartItem
    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: {
          product: {
            include: {
              images: { take: 1, orderBy: { order: "asc" } },
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
              images: { take: 1, orderBy: { order: "asc" } },
            },
          },
        },
      })
    }

    // Invalidate cart cache
    await cache.del(CacheKeys.userCart(user.id))

    log.businessEvent('Item added to cart', {
      event: 'cart_add_item',
      userId: user.id,
      entityType: 'cart_item',
      entityId: cartItem.id,
      details: { productId, quantity }
    })

    return NextResponse.json(cartItem, { status: 201 })
  } catch (error) {
    log.error('Failed to add to cart', {
      error: error instanceof Error ? error : String(error)
    })
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 }
    )
  }
}