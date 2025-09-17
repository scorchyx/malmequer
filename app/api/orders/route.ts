import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { validateRequestBody, createOrderSchema, validateQueryParams, paginationSchema } from "@/lib/validation"
import { cache, CacheKeys, CacheTTL } from "@/lib/cache"
import { log } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)

    // Validate query parameters
    const validation = validateQueryParams(paginationSchema, searchParams)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.errors },
        { status: 400 }
      )
    }

    const { page = 1, limit = 10 } = validation.data
    const skip = (page - 1) * limit

    // Try cache first
    const cacheKey = CacheKeys.userOrders(user.id, page)
    const cachedOrders = await cache.get(cacheKey)
    if (cachedOrders) {
      return NextResponse.json(cachedOrders)
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { take: 1, orderBy: { order: "asc" } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId: user.id } }),
    ])

    const result = {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }

    // Cache for 2 minutes
    await cache.set(cacheKey, result, CacheTTL.SHORT * 2)

    log.info('Orders fetched successfully', {
      userId: user.id,
      count: orders.length,
      page,
      type: 'api_request'
    })

    return NextResponse.json(result)
  } catch (error) {
    log.error('Failed to fetch orders', {
      error: error instanceof Error ? error : String(error),
      userId: user?.id
    })
    return NextResponse.json(
      { error: "Failed to fetch orders" },
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

    const body = await request.json()
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      shippingMethod,
      notes,
    } = body

    // Calculate totals
    const subtotalAmount = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.price,
      0
    )
    const taxAmount = subtotalAmount * 0.1 // 10% tax
    const shippingAmount = 10 // Fixed shipping
    const totalAmount = subtotalAmount + taxAmount + shippingAmount

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        subtotalAmount,
        taxAmount,
        shippingAmount,
        totalAmount,
        paymentMethod,
        shippingMethod,
        notes,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
        shippingAddress: {
          create: shippingAddress,
        },
        billingAddress: {
          create: billingAddress,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    })

    // Clear cart after order creation
    await prisma.cartItem.deleteMany({
      where: { userId: user.id },
    })

    // Invalidate user orders cache
    await cache.invalidatePattern(`orders:user:${user.id}:*`)
    await cache.del(CacheKeys.userCart(user.id))

    log.businessEvent('Order created successfully', {
      event: 'order_creation',
      userId: user.id,
      entityType: 'order',
      entityId: order.id,
      details: { orderNumber, totalAmount }
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    log.error('Failed to create order', {
      error: error instanceof Error ? error : String(error),
      userId: user?.id
    })
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}