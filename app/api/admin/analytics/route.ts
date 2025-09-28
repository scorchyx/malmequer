import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { cache, CacheTTL } from '@/lib/cache'
import { log } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') ?? '30d' // 7d, 30d, 90d, 1y
    const metric = searchParams.get('metric') ?? 'overview' // overview, sales, products, users

    // Cache key based on period and metric
    const cacheKey = `analytics:${metric}:${period}`
    const cachedData = await cache.get(cacheKey)
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    let startDate: Date
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }

    let analyticsData: any = {}

    switch (metric) {
      case 'overview':
        analyticsData = await getOverviewAnalytics(startDate)
        break
      case 'sales':
        analyticsData = await getSalesAnalytics(startDate, period)
        break
      case 'products':
        analyticsData = await getProductAnalytics(startDate)
        break
      case 'users':
        analyticsData = await getUserAnalytics(startDate)
        break
      default:
        analyticsData = await getOverviewAnalytics(startDate)
    }

    // Cache for 15 minutes
    await cache.set(cacheKey, analyticsData, CacheTTL.MEDIUM)

    log.info('Analytics data requested', {
      adminId: user.id,
      metric,
      period,
    })

    return NextResponse.json(analyticsData)
  } catch (error) {
    log.error('Error fetching analytics', {
      error: error instanceof Error ? error : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 },
    )
  }
}

async function getOverviewAnalytics(startDate: Date) {
  const [
    totalRevenue,
    totalOrders,
    totalUsers,
    totalProducts,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    // Total revenue in period
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startDate },
        paymentStatus: 'PAID',
      },
      _sum: { totalAmount: true },
      _count: true,
    }),

    // Total orders
    prisma.order.count({
      where: {
        createdAt: { gte: startDate },
      },
    }),

    // Total users registered in period
    prisma.user.count({
      where: {
        createdAt: { gte: startDate },
      },
    }),

    // Total active products
    prisma.product.count({
      where: {
        status: 'ACTIVE',
      },
    }),

    // Recent orders (last 10)
    prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),

    // Top selling products
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: startDate },
          paymentStatus: 'PAID',
        },
      },
      _sum: {
        quantity: true,
      },
      _count: {
        productId: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    }),
  ])

  // Get product details for top products
  const topProductIds = topProducts.map(p => p.productId)
  const productDetails = await prisma.product.findMany({
    where: {
      id: { in: topProductIds },
    },
    select: {
      id: true,
      name: true,
      price: true,
      images: {
        take: 1,
        orderBy: { order: 'asc' },
      },
    },
  })

  const topProductsWithDetails = topProducts.map(tp => {
    const product = productDetails.find(p => p.id === tp.productId)
    return {
      ...tp,
      product,
    }
  })

  return {
    period: startDate.toISOString(),
    revenue: {
      total: totalRevenue._sum.totalAmount ?? 0,
      orders: totalRevenue._count,
      averageOrderValue: totalRevenue._count > 0
        ? Number(totalRevenue._sum.totalAmount ?? 0) / totalRevenue._count
        : 0,
    },
    orders: {
      total: totalOrders,
    },
    users: {
      newUsers: totalUsers,
    },
    products: {
      total: totalProducts,
    },
    recentOrders: recentOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customer: order.user ? {
        name: order.user.name,
        email: order.user.email,
      } : {
        email: order.guestEmail ?? 'Guest',
      },
      createdAt: order.createdAt,
    })),
    topProducts: topProductsWithDetails,
  }
}

async function getSalesAnalytics(startDate: Date, period: string) {
  // Get daily/weekly/monthly sales data for charts
  let dateFormat: string

  switch (period) {
    case '7d':
      dateFormat = 'day'
      break
    case '30d':
      dateFormat = 'day'
      break
    case '90d':
      dateFormat = 'week'
      break
    case '1y':
      dateFormat = 'month'
      break
    default:
      dateFormat = 'day'
  }

  const salesByDay = await prisma.$queryRaw<{ date: Date; orders: number; revenue: number }[]>`
    SELECT
      DATE_TRUNC(${dateFormat}, "createdAt") as date,
      COUNT(*)::int as orders,
      COALESCE(SUM("totalAmount"), 0) as revenue
    FROM "Order"
    WHERE "createdAt" >= ${startDate}
      AND "paymentStatus" = 'PAID'
    GROUP BY DATE_TRUNC(${dateFormat}, "createdAt")
    ORDER BY date ASC
  `

  // Payment method breakdown
  const paymentMethods = await prisma.order.groupBy({
    by: ['paymentMethod'],
    where: {
      createdAt: { gte: startDate },
      paymentStatus: 'PAID',
    },
    _count: {
      paymentMethod: true,
    },
    _sum: {
      totalAmount: true,
    },
  })

  // Order status breakdown
  const orderStatuses = await prisma.order.groupBy({
    by: ['status'],
    where: {
      createdAt: { gte: startDate },
    },
    _count: {
      status: true,
    },
  })

  return {
    period: startDate.toISOString(),
    salesChart: salesByDay,
    paymentMethods: paymentMethods.map(pm => ({
      method: pm.paymentMethod ?? 'Unknown',
      count: pm._count.paymentMethod,
      revenue: pm._sum.totalAmount ?? 0,
    })),
    orderStatuses: orderStatuses.map(os => ({
      status: os.status,
      count: os._count.status,
    })),
  }
}

async function getProductAnalytics(startDate: Date) {
  const [
    topSellingProducts,
    lowStockProducts,
    categoryPerformance,
    recentlyAddedProducts,
  ] = await Promise.all([
    // Top selling products with revenue
    prisma.$queryRaw<{
      id: string;
      name: string;
      price: number;
      inventory: number;
      total_sold: number;
      total_revenue: number;
    }[]>`
      SELECT
        p.id,
        p.name,
        p.price,
        p.inventory,
        SUM(oi.quantity)::int as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue
      FROM "Product" p
      INNER JOIN "OrderItem" oi ON p.id = oi."productId"
      INNER JOIN "Order" o ON oi."orderId" = o.id
      WHERE o."createdAt" >= ${startDate}
        AND o."paymentStatus" = 'PAID'
      GROUP BY p.id, p.name, p.price, p.inventory
      ORDER BY total_sold DESC
      LIMIT 10
    `,

    // Low stock products (products with total variant inventory < 10)
    prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        variants: {
          some: {
            inventory: { lt: 10 },
          },
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        variants: {
          select: {
            inventory: true,
          },
        },
      },
      take: 10,
    }),

    // Category performance
    prisma.$queryRaw<{
      id: string;
      name: string;
      product_count: number;
      total_sold: number;
      total_revenue: number;
    }[]>`
      SELECT
        c.id,
        c.name,
        COUNT(DISTINCT p.id)::int as product_count,
        COALESCE(SUM(oi.quantity), 0)::int as total_sold,
        COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue
      FROM "Category" c
      LEFT JOIN "Product" p ON c.id = p."categoryId"
      LEFT JOIN "OrderItem" oi ON p.id = oi."productId"
      LEFT JOIN "Order" o ON oi."orderId" = o.id
        AND o."createdAt" >= ${startDate}
        AND o."paymentStatus" = 'PAID'
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC
    `,

    // Recently added products
    prisma.product.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        name: true,
        price: true,
        status: true,
        createdAt: true,
        category: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  return {
    period: startDate.toISOString(),
    topSellingProducts,
    lowStockProducts,
    categoryPerformance,
    recentlyAddedProducts,
  }
}

async function getUserAnalytics(startDate: Date) {
  const [
    userRegistrations,
    topCustomers,
    userActivity,
  ] = await Promise.all([
    // User registrations over time
    prisma.$queryRaw<{ date: Date; registrations: number }[]>`
      SELECT
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*)::int as registrations
      FROM "User"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `,

    // Top customers by order value
    prisma.$queryRaw<{
      id: string;
      name: string;
      email: string;
      order_count: number;
      total_spent: number;
      last_order_date: Date;
    }[]>`
      SELECT
        u.id,
        u.name,
        u.email,
        COUNT(o.id)::int as order_count,
        COALESCE(SUM(o."totalAmount"), 0) as total_spent,
        MAX(o."createdAt") as last_order_date
      FROM "User" u
      INNER JOIN "Order" o ON u.id = o."userId"
      WHERE o."createdAt" >= ${startDate}
        AND o."paymentStatus" = 'PAID'
      GROUP BY u.id, u.name, u.email
      ORDER BY total_spent DESC
      LIMIT 10
    `,

    // User role distribution
    prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
    }),
  ])

  return {
    period: startDate.toISOString(),
    userRegistrations,
    topCustomers,
    userRoles: userActivity.map(ua => ({
      role: ua.role,
      count: ua._count.role,
    })),
  }
}