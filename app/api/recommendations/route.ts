import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { cache, CacheKeys, CacheTTL } from '@/lib/cache'
import { log } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

interface RecommendationParams {
  type: 'related' | 'popular' | 'trending' | 'personalized' | 'frequently-bought-together' | 'similar-users'
  productId?: string
  categoryId?: string
  limit?: number
  userId?: string
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { searchParams } = new URL(request.url)

    const params: RecommendationParams = {
      type: (searchParams.get('type') as any) || 'popular',
      productId: searchParams.get('productId') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      limit: Math.min(parseInt(searchParams.get('limit') || '10'), 20),
      userId: user?.id,
    }

    // Create cache key
    const cacheKey = `recommendations:${params.type}:${params.productId || 'none'}:${params.categoryId || 'none'}:${params.userId || 'anonymous'}:${params.limit}`

    // Try cache first
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json({ ...cached, cached: true })
    }

    let recommendations: any[] = []

    switch (params.type) {
      case 'related':
        recommendations = await getRelatedProducts(params)
        break
      case 'popular':
        recommendations = await getPopularProducts(params)
        break
      case 'trending':
        recommendations = await getTrendingProducts(params)
        break
      case 'personalized':
        recommendations = await getPersonalizedRecommendations(params)
        break
      case 'frequently-bought-together':
        recommendations = await getFrequentlyBoughtTogether(params)
        break
      case 'similar-users':
        recommendations = await getSimilarUsersRecommendations(params)
        break
      default:
        recommendations = await getPopularProducts(params)
    }

    const result = {
      type: params.type,
      recommendations,
      metadata: {
        count: recommendations.length,
        generatedAt: new Date().toISOString(),
        userId: params.userId || null,
        cached: false,
      },
    }

    // Cache the result
    await cache.set(cacheKey, result, CacheTTL.MEDIUM)

    log.info('Recommendations generated', {
      type: params.type,
      count: recommendations.length,
      userId: params.userId,
      productId: params.productId,
    })

    return NextResponse.json(result)
  } catch (error) {
    log.error('Error generating recommendations', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 },
    )
  }
}

// Get products related to a specific product (same category, similar tags)
async function getRelatedProducts(params: RecommendationParams) {
  if (!params.productId) {
    throw new Error('Product ID is required for related products')
  }

  const baseProduct = await prisma.product.findUnique({
    where: { id: params.productId },
    select: {
      categoryId: true,
      price: true,
    },
  })

  if (!baseProduct) {
    return []
  }

  const priceRange = {
    min: Number(baseProduct.price) * 0.5, // 50% lower
    max: Number(baseProduct.price) * 2.0, // 100% higher
  }

  return await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      inventory: { gt: 0 },
      id: { not: params.productId },
      categoryId: baseProduct.categoryId,
      price: {
        gte: priceRange.min,
        lte: priceRange.max,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      comparePrice: true,
      inventory: true,
      images: {
        take: 1,
        select: { url: true, alt: true },
      },
      category: {
        select: { name: true },
      },
      _count: {
        select: { orderItems: true },
      },
    },
    orderBy: [
      { orderItems: { _count: 'desc' } }, // Most ordered first
      { createdAt: 'desc' },
    ],
    take: params.limit,
  })
}

// Get most popular products (by order count)
async function getPopularProducts(params: RecommendationParams) {
  const where: any = {
    status: 'ACTIVE',
    inventory: { gt: 0 },
  }

  if (params.categoryId) {
    where.categoryId = params.categoryId
  }

  return await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      comparePrice: true,
      inventory: true,
      images: {
        take: 1,
        select: { url: true, alt: true },
      },
      category: {
        select: { name: true },
      },
      _count: {
        select: { orderItems: true },
      },
    },
    orderBy: {
      orderItems: { _count: 'desc' },
    },
    take: params.limit,
  })
}

// Get trending products (recent sales velocity)
async function getTrendingProducts(params: RecommendationParams) {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const where: any = {
    status: 'ACTIVE',
    inventory: { gt: 0 },
  }

  if (params.categoryId) {
    where.categoryId = params.categoryId
  }

  // Get products with recent orders
  const productsWithRecentSales = await prisma.product.findMany({
    where: {
      ...where,
      orderItems: {
        some: {
          order: {
            createdAt: { gte: sevenDaysAgo },
            paymentStatus: 'PAID',
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      comparePrice: true,
      inventory: true,
      images: {
        take: 1,
        select: { url: true, alt: true },
      },
      category: {
        select: { name: true },
      },
      orderItems: {
        where: {
          order: {
            createdAt: { gte: sevenDaysAgo },
            paymentStatus: 'PAID',
          },
        },
        select: {
          quantity: true,
        },
      },
    },
    take: params.limit! * 2, // Get more to sort by recent sales
  })

  // Calculate recent sales and sort
  const trending = productsWithRecentSales
    .map(product => ({
      ...product,
      recentSales: product.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      orderItems: undefined, // Remove from final result
    }))
    .sort((a, b) => b.recentSales - a.recentSales)
    .slice(0, params.limit)

  return trending
}

// Get personalized recommendations based on user's purchase history
async function getPersonalizedRecommendations(params: RecommendationParams) {
  if (!params.userId) {
    // Fall back to popular products for anonymous users
    return await getPopularProducts(params)
  }

  // Get user's purchase history
  const userOrders = await prisma.order.findMany({
    where: {
      userId: params.userId,
      paymentStatus: 'PAID',
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              categoryId: true,
            },
          },
        },
      },
    },
  })

  if (userOrders.length === 0) {
    return await getPopularProducts(params)
  }

  // Extract categories from user's purchases
  const purchasedCategories = new Set<string>()
  const purchasedProductIds = new Set<string>()

  userOrders.forEach(order => {
    order.items.forEach(item => {
      purchasedProductIds.add(item.productId)
      if (item.product.categoryId) {
        purchasedCategories.add(item.product.categoryId)
      }
    })
  })

  // Find products in similar categories
  return await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      inventory: { gt: 0 },
      id: { notIn: Array.from(purchasedProductIds) }, // Exclude already purchased
      categoryId: { in: Array.from(purchasedCategories) },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      comparePrice: true,
      inventory: true,
      images: {
        take: 1,
        select: { url: true, alt: true },
      },
      category: {
        select: { name: true },
      },
      _count: {
        select: { orderItems: true },
      },
    },
    orderBy: {
      orderItems: { _count: 'desc' },
    },
    take: params.limit,
  })
}

// Get products frequently bought together with a specific product
async function getFrequentlyBoughtTogether(params: RecommendationParams) {
  if (!params.productId) {
    throw new Error('Product ID is required for frequently bought together')
  }

  // Find orders that contain the specified product
  const ordersWithProduct = await prisma.order.findMany({
    where: {
      paymentStatus: 'PAID',
      items: {
        some: {
          productId: params.productId,
        },
      },
    },
    include: {
      items: {
        where: {
          productId: { not: params.productId },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              comparePrice: true,
              inventory: true,
              status: true,
              images: {
                take: 1,
                select: { url: true, alt: true },
              },
              category: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
  })

  // Count how often each product appears with the target product
  const productCounts = new Map<string, { product: any; count: number }>()

  ordersWithProduct.forEach(order => {
    order.items.forEach(item => {
      if (item.product.status === 'ACTIVE' && item.product.inventory > 0) {
        const existing = productCounts.get(item.productId)
        if (existing) {
          existing.count++
        } else {
          productCounts.set(item.productId, {
            product: item.product,
            count: 1,
          })
        }
      }
    })
  })

  // Sort by frequency and return top results
  return Array.from(productCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, params.limit)
    .map(item => item.product)
}

// Get recommendations based on similar users' purchases
async function getSimilarUsersRecommendations(params: RecommendationParams) {
  if (!params.userId) {
    return await getPopularProducts(params)
  }

  // Get current user's purchased categories
  const userCategories = await prisma.orderItem.findMany({
    where: {
      order: {
        userId: params.userId,
        paymentStatus: 'PAID',
      },
    },
    include: {
      product: {
        select: { categoryId: true },
      },
    },
  })

  const userCategoryIds = new Set(
    userCategories.map(item => item.product.categoryId).filter(Boolean),
  )

  if (userCategoryIds.size === 0) {
    return await getPopularProducts(params)
  }

  // Find users who bought products in similar categories
  const similarUsers = await prisma.orderItem.findMany({
    where: {
      order: {
        userId: { not: params.userId },
        paymentStatus: 'PAID',
      },
      product: {
        categoryId: { in: Array.from(userCategoryIds) },
      },
    },
    select: {
      order: { select: { userId: true } },
      productId: true,
    },
    distinct: ['productId', 'orderId'],
  })

  // Get products purchased by similar users that current user hasn't bought
  const userPurchasedProducts = new Set(
    userCategories.map(item => item.productId),
  )

  const recommendedProductIds = new Set<string>()
  similarUsers.forEach(item => {
    if (!userPurchasedProducts.has(item.productId)) {
      recommendedProductIds.add(item.productId)
    }
  })

  if (recommendedProductIds.size === 0) {
    return await getPopularProducts(params)
  }

  return await prisma.product.findMany({
    where: {
      id: { in: Array.from(recommendedProductIds) },
      status: 'ACTIVE',
      inventory: { gt: 0 },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      comparePrice: true,
      inventory: true,
      images: {
        take: 1,
        select: { url: true, alt: true },
      },
      category: {
        select: { name: true },
      },
      _count: {
        select: { orderItems: true },
      },
    },
    orderBy: {
      orderItems: { _count: 'desc' },
    },
    take: params.limit,
  })
}